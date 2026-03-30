import fs from 'fs';
import path from 'path';
import { Clip, Project } from '@prisma/client';
import { db } from '@/lib/db';
import { stageDefinitions, ProjectType } from '@/lib/templates';
import { imageService } from './ImageService';
import { klingService } from './KlingService';
import { ffmpegService } from './FfmpegService';

class ClipService {
  constructor() {
    this.recoverStuckClips().catch(console.error);
  }

  private async recoverStuckClips(): Promise<void> {
    // Reset any clips stuck mid-image-generation
    const stuckImages = await db.clip.updateMany({
      where: { imageStatus: 'generating' },
      data: { imageStatus: 'error', imageErrorMessage: 'Interrupted by server restart. Click Retry.' },
    });
    // Reset any clips stuck mid-video-generation
    const stuckVideos = await db.clip.updateMany({
      where: { status: 'generating_video' },
      data: { status: 'error', errorMessage: 'Interrupted by server restart. Click Retry.' },
    });
    const total = stuckImages.count + stuckVideos.count;
    if (total > 0) console.log(`[ClipService] Reset ${total} stuck clip(s) to error state`);
  }

  // ─── Phase 1: Image generation ─────────────────────────────────────────────

  /**
   * Ensure all stage clips exist for the project, then generate images for
   * all stages that don't have one yet. Fire-and-forget.
   */
  async generateAllImages(projectId: string): Promise<Clip[]> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { clips: { orderBy: { stageIndex: 'asc' } } },
    });
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const stages = stageDefinitions[project.type as ProjectType] ?? stageDefinitions.generic_transformation;

    // Create any missing clip records
    const existingIndexes = new Set(project.clips.map((c) => c.stageIndex));
    for (let i = 0; i < stages.length; i++) {
      if (!existingIndexes.has(i)) {
        const stage = stages[i];
        await db.clip.create({
          data: {
            projectId,
            stageIndex: i,
            ideaTitle: project.name,
            stageDescription: stage.description,
            masterPrompt: project.masterPrompt,
            imagePrompt: stage.imageDiff ?? stage.imagePrompt,
            klingPrompt: stage.videoPrompt ?? '',
            imageStatus: 'pending',
            status: i === 0 ? 'no_video' : 'pending',
          },
        });
      }
    }

    const clips = await db.clip.findMany({
      where: { projectId },
      orderBy: { stageIndex: 'asc' },
    });

    // Fire image generation for all pending stages
    this.runAllImageGenerations(clips, project).catch(console.error);

    return clips;
  }

  private async runAllImageGenerations(clips: Clip[], project: Project): Promise<void> {
    const stages = stageDefinitions[project.type as ProjectType] ?? stageDefinitions.generic_transformation;
    const projectDir = path.join(process.cwd(), 'data', 'projects', project.id);
    const imagesDir = path.join(projectDir, 'images');
    fs.mkdirSync(imagesDir, { recursive: true });

    for (const clip of clips) {
      // Skip if already done or currently generating
      if (clip.imageStatus === 'done' || clip.imageStatus === 'generating') continue;

      const stage = stages[clip.stageIndex];
      if (!stage) continue;

      await db.clip.update({
        where: { id: clip.id },
        data: { imageStatus: 'generating', imageErrorMessage: null },
      });

      const outputPath = path.join(imagesDir, `stage-${clip.stageIndex}.png`);

      try {
        if (clip.stageIndex === 0) {
          // Text-to-image for stage 0
          await imageService.generateFromText(stage.imagePrompt, project.aspectRatio, outputPath);
        } else {
          // Image-to-image for stages 1+: use previous stage's image
          const prevClip = clips.find((c) => c.stageIndex === clip.stageIndex - 1);
          if (!prevClip?.startImagePath || !fs.existsSync(prevClip.startImagePath)) {
            throw new Error(`Previous stage ${clip.stageIndex - 1} image not ready`);
          }
          await imageService.generateFromImage(
            prevClip.startImagePath,
            stage.imageDiff!,
            project.aspectRatio,
            outputPath
          );
        }

        await db.clip.update({
          where: { id: clip.id },
          data: { startImagePath: outputPath, imageStatus: 'done' },
        });

        // Update the in-memory clips array so next iteration has the path
        clip.startImagePath = outputPath;
        clip.imageStatus = 'done';
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`Image generation failed for stage ${clip.stageIndex}:`, msg);
        await db.clip.update({
          where: { id: clip.id },
          data: { imageStatus: 'error', imageErrorMessage: `Image generation failed: ${msg}` },
        });
        // Stop — subsequent stages depend on this one
        break;
      }
    }
  }

  // ─── Phase 2: Video generation ─────────────────────────────────────────────

  /**
   * Generate videos for all stages that have images but no video yet.
   * Each video transitions from the previous stage image to this stage image.
   */
  async generateAllVideos(projectId: string): Promise<Clip[]> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { clips: { orderBy: { stageIndex: 'asc' } } },
    });
    if (!project) throw new Error(`Project not found: ${projectId}`);

    // Validate: all images must be done
    const notReady = project.clips.filter((c) => c.imageStatus !== 'done');
    if (notReady.length > 0) {
      throw new Error('All stage images must be generated before creating videos. Generate images first.');
    }

    this.runAllVideoGenerations(project.clips, project).catch(console.error);
    return project.clips;
  }

  private async runAllVideoGenerations(clips: Clip[], project: Project): Promise<void> {
    const stages = stageDefinitions[project.type as ProjectType] ?? stageDefinitions.generic_transformation;
    const projectDir = path.join(process.cwd(), 'data', 'projects', project.id);
    const videosDir = path.join(projectDir, 'clips');
    fs.mkdirSync(videosDir, { recursive: true });

    // Skip stage 0 — it has no incoming video
    const videoClips = clips.filter((c) => c.stageIndex > 0);

    for (const clip of videoClips) {
      if (clip.status === 'done' || clip.status === 'generating_video') continue;

      const stage = stages[clip.stageIndex];
      if (!stage?.videoPrompt) continue;

      const prevClip = clips.find((c) => c.stageIndex === clip.stageIndex - 1);
      if (!prevClip?.startImagePath || !clip.startImagePath) {
        await db.clip.update({
          where: { id: clip.id },
          data: { status: 'error', errorMessage: 'Missing image for this or previous stage' },
        });
        continue;
      }

      await db.clip.update({
        where: { id: clip.id },
        data: { status: 'generating_video', errorMessage: null },
      });

      const videoPath = path.join(videosDir, `clip-${clip.stageIndex}.mp4`);

      try {
        await klingService.generateVideo(
          {
            prompt: stage.videoPrompt,
            startImagePath: prevClip.startImagePath,
            endImagePath: clip.startImagePath,
            aspectRatio: project.aspectRatio,
            duration: 5,
          },
          videoPath
        );

        await db.clip.update({
          where: { id: clip.id },
          data: { videoPath, status: 'done' },
        });

        clip.status = 'done';
        clip.videoPath = videoPath;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`Video generation failed for stage ${clip.stageIndex}:`, msg);
        await db.clip.update({
          where: { id: clip.id },
          data: { status: 'error', errorMessage: msg },
        });
        break;
      }
    }
  }

  // ─── Retry ─────────────────────────────────────────────────────────────────

  async retryImageGeneration(clipId: string): Promise<Clip> {
    const clip = await db.clip.findUnique({
      where: { id: clipId },
      include: { project: { include: { clips: { orderBy: { stageIndex: 'asc' } } } } },
    });
    if (!clip) throw new Error(`Clip not found: ${clipId}`);

    const updated = await db.clip.update({
      where: { id: clipId },
      data: { imageStatus: 'pending', imageErrorMessage: null },
    });

    const allClips = clip.project.clips.map((c) => (c.id === clipId ? updated : c));
    this.runAllImageGenerations(allClips, clip.project).catch(console.error);
    return updated;
  }

  async retryVideoGeneration(clipId: string): Promise<Clip> {
    const clip = await db.clip.findUnique({
      where: { id: clipId },
      include: { project: { include: { clips: { orderBy: { stageIndex: 'asc' } } } } },
    });
    if (!clip) throw new Error(`Clip not found: ${clipId}`);
    if (clip.status === 'done') throw new Error('Video already generated');

    const updated = await db.clip.update({
      where: { id: clipId },
      data: { status: 'pending', errorMessage: null },
    });

    const allClips = clip.project.clips.map((c) => (c.id === clipId ? updated : c));
    this.runAllVideoGenerations(allClips, clip.project).catch(console.error);
    return updated;
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  async renderTimelapse(projectId: string): Promise<string> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { clips: { orderBy: { stageIndex: 'asc' } } },
    });
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const doneVideos = project.clips
      .filter((c) => c.stageIndex > 0 && c.status === 'done' && c.videoPath)
      .map((c) => c.videoPath!);

    if (doneVideos.length === 0) throw new Error('No completed videos to render');

    const outputDir = path.join(process.cwd(), 'data', 'projects', projectId);
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'timelapse.mp4');
    await ffmpegService.renderTimelapse(doneVideos, null, outputPath);
    return outputPath;
  }
}

export const clipService = new ClipService();
