import { NextRequest, NextResponse } from 'next/server';
import fs, { createReadStream, statSync } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const finalVideoPath = path.join(
    process.cwd(),
    'data',
    'projects',
    params.id,
    'final.mp4'
  );

  if (!fs.existsSync(finalVideoPath)) {
    return NextResponse.json({ error: 'Final video not found' }, { status: 404 });
  }

  try {
    const stat = statSync(finalVideoPath);
    const fileSize = stat.size;

    const rangeHeader = request.headers.get('range');

    if (rangeHeader) {
      // Support range requests for video seeking
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const stream = createReadStream(finalVideoPath, { start, end });
      const readableStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(readableStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': String(chunkSize),
          'Content-Type': 'video/mp4',
        },
      });
    } else {
      // Full file response
      const stream = createReadStream(finalVideoPath);
      const readableStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(readableStream, {
        status: 200,
        headers: {
          'Content-Length': String(fileSize),
          'Content-Type': 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Content-Disposition': `attachment; filename="timelapse-${params.id}.mp4"`,
        },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
