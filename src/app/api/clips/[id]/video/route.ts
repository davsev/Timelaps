import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clip = await db.clip.findUnique({ where: { id: params.id } });

  if (!clip || !clip.videoPath) {
    return NextResponse.json({ error: 'Clip video not found' }, { status: 404 });
  }

  if (!fs.existsSync(clip.videoPath)) {
    return NextResponse.json({ error: 'Video file not found on disk' }, { status: 404 });
  }

  const stat = fs.statSync(clip.videoPath);
  const fileBuffer = fs.readFileSync(clip.videoPath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'private, max-age=86400',
      'Content-Disposition': `inline; filename="clip-${clip.stageIndex}.mp4"`,
    },
  });
}
