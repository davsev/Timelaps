import { NextRequest, NextResponse } from 'next/server';
import { clipService } from '@/services/ClipService';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clip = await clipService.retryClip(params.id);
    return NextResponse.json(clip);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
