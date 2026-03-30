import { NextRequest, NextResponse } from 'next/server';
import { clipService } from '@/services/ClipService';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clips = await clipService.generateAllVideos(params.id);
    return NextResponse.json(clips, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
