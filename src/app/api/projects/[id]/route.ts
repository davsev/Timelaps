import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { projectService } from '@/services/ProjectService';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await projectService.getProject(params.id);

    // Check if the final video exists
    const finalVideoPath = path.join(
      process.cwd(),
      'data',
      'projects',
      params.id,
      'final.mp4'
    );
    const finalVideoExists = fs.existsSync(finalVideoPath);

    return NextResponse.json({ ...project, finalVideoExists });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
