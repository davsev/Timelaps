import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { projectService } from '@/services/ProjectService';
import { ffmpegService } from '@/services/FfmpegService';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await projectService.getProject(params.id);

    // Get all done clips ordered by stageIndex
    const doneClips = project.clips
      .filter((c) => c.status === 'done' && c.videoPath)
      .sort((a, b) => a.stageIndex - b.stageIndex);

    if (doneClips.length === 0) {
      return NextResponse.json(
        { error: 'No completed clips to render' },
        { status: 400 }
      );
    }

    const videoPaths = doneClips.map((c) => c.videoPath as string);

    // Check for background music
    const musicPath = path.join(process.cwd(), 'data', 'music', 'background.mp3');
    const hasMusicFile = fs.existsSync(musicPath);

    // Output path
    const outputDir = path.join(process.cwd(), 'data', 'projects', params.id);
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'final.mp4');

    await ffmpegService.renderTimelapse(
      videoPaths,
      hasMusicFile ? musicPath : null,
      outputPath
    );

    return NextResponse.json({ finalVideoPath: outputPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
