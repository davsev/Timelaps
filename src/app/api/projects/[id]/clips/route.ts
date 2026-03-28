import { NextRequest, NextResponse } from 'next/server';
import { clipService } from '@/services/ClipService';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clip = await clipService.generateNextClip(params.id);
    return NextResponse.json(clip, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
