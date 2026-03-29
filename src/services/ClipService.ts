import fs from 'fs';
import path from 'path';
import { Clip, Project } from '@prisma/client';
import { db } from '@/lib/db';
import {
  stageDescriptions,
  buildImagePrompt,
  buildKlingPrompt,
} from '@/lib/templates';
import { imageService } from './ImageService';
import { klingService } from './KlingService';
import { ffmpegService } from './FfmpegService';

class ClipService {
  /**
   * Determine the next stage index for the project and create a clip record,
   * then trigger async generation. Returns the created clip immediately.
   */
  async generateNextClip(projectId: string): Promise<Clip> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { clips: { orderBy: { stageIndex: 'asc' } } },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const stages = stageDescriptions[project.type as import('@/lib/templates').ProjectType] ?? stageDescriptions.generic_transformation;
    const nextIndex = project.clips.length;

    if (nextIndex >= stages.length) {
      throw new Error(
        `All ${stages.length} stages already generated for project ${projectId}`
      );
    }

    // Block progression if the last clip failed
    const lastClip = project.clips[project.clips.length - 1];
    if (lastClip && lastClip.status === 'error') {
      throw new Error(
        `Stage ${lastClip.stageIndex + 1} failed. Resolve the error before generating the next stage.`
      );
    }

    const stageDescription = stages[nextIndex];
    const prevStageDescription = nextIndex > 0 ? stages[nextIndex - 1] : stages[0];

    const imagePrompt = buildImagePrompt(project.masterPrompt, stageDescription);
    const klingPrompt = buildKlingPrompt(
      project.description,
      project.style,
      prevStageDescription,
      stageDescription
    );

    // Create the DB record immediately
    const clip = await db.clip.create({
      data: {
        projectId,
        stageIndex: nextIndex,
        ideaTitle: project.name,
        stageDescription,
        masterPrompt: project.masterPrompt,
        imagePrompt,
        klingPrompt,
        status: 'pending',
      },
    });

    // Fire-and-forget: run generation in background
    this.runClipGeneration(clip, project).catch(console.error);

    return clip;
  }

  /**
   * The actual async generation pipeline for a clip
   */
  private async runClipGeneration(clip: Clip, project: Project): Promise<void> {
    const dataDir = process.cwd();
    const projectDir = path.join(dataDir, 'data', 'projects', project.id);
    const framesDir = path.join(projectDir, 'frames');
    const clipsDir = path.join(projectDir, 'clips');

    // Ensure directories exist
    fs.mkdirSync(framesDir, { recursive: true });
    fs.mkdirSync(clipsDir, { recursive: true });

    try {
      // Step 1: generating_image
      await db.clip.update({
        where: { id: clip.id },
        data: { status: 'generating_image' },
      });

      let startImagePath: string;

      if (clip.stageIndex === 0) {
        // Generate a placeholder image for the first stage
        startImagePath = path.join(framesDir, `clip-0-start.png`);
        await imageService.generateImage(clip.imagePrompt, project.aspectRatio, startImagePath);
      } else {
        // Extract the last frame from the previous clip's video
        const prevClip = await db.clip.findFirst({
          where: { projectId: project.id, stageIndex: clip.stageIndex - 1 },
        });

        if (!prevClip || !prevClip.videoPath) {
          throw new Error(
            `Previous clip (stage ${clip.stageIndex - 1}) not found or has no video`
          );
        }

        startImagePath = path.join(framesDir, `clip-${clip.stageIndex}-start.png`);
        await ffmpegService.extractLastFrame(prevClip.videoPath, startImagePath);
      }

      // Save startImagePath to DB
      await db.clip.update({
        where: { id: clip.id },
        data: { startImagePath },
      });

      // Step 2: generating_video
      await db.clip.update({
        where: { id: clip.id },
        data: { status: 'generating_video' },
      });

      const videoPath = path.join(clipsDir, `clip-${clip.stageIndex}.mp4`);

      await klingService.generateVideo(
        {
          prompt: clip.klingPrompt,
          startImagePath,
          aspectRatio: project.aspectRatio,
          duration: 5,
        },
        videoPath
      );

      // Step 3: done
      await db.clip.update({
        where: { id: clip.id },
        data: {
          videoPath,
          status: 'done',
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Clip generation failed for clip ${clip.id}:`, errorMessage);

      await db.clip.update({
        where: { id: clip.id },
        data: {
          status: 'error',
          errorMessage,
        },
      });
    }
  }
}

export const clipService = new ClipService();
