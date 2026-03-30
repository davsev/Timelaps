import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clip = await db.clip.findUnique({ where: { id: params.id } });

  if (!clip || !clip.startImagePath || !fs.existsSync(clip.startImagePath)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  const buffer = fs.readFileSync(clip.startImagePath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=86400',
    },
  });
}
