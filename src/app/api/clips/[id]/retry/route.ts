import { NextRequest, NextResponse } from 'next/server';
import { clipService } from '@/services/ClipService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const phase = body?.phase === 'video' ? 'video' : 'image';

    const clip =
      phase === 'video'
        ? await clipService.retryVideoGeneration(params.id)
        : await clipService.retryImageGeneration(params.id);

    return NextResponse.json(clip);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
