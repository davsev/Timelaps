import { NextRequest, NextResponse } from 'next/server';
import { clipService } from '@/services/ClipService';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      { error: 'FAL_KEY is not set in your .env file. Add your Fal.ai API key to generate images.' },
      { status: 400 }
    );
  }

  try {
    const clips = await clipService.generateAllImages(params.id);
    return NextResponse.json(clips, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
