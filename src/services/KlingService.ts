import fs from 'fs';
import path from 'path';
import axios from 'axios';

interface KlingOptions {
  prompt: string;
  startImagePath?: string; // if provided, use image-to-video
  aspectRatio: string; // "9:16" or "16:9"
  duration?: number; // seconds, default 5
}

type AspectRatioValue = '9:16' | '16:9' | '1:1' | '4:5';

function mapAspectRatio(ar: string): AspectRatioValue {
  const mapping: Record<string, AspectRatioValue> = {
    '9:16': '9:16',
    '16:9': '16:9',
    '1:1': '1:1',
    '4:5': '4:5',
  };
  return mapping[ar] ?? '9:16';
}

class KlingService {
  async generateVideo(options: KlingOptions, outputPath: string): Promise<void> {
    const { fal } = await import('@fal-ai/client');

    fal.config({ credentials: process.env.KLING_API_KEY });

    const aspectRatio = mapAspectRatio(options.aspectRatio);
    const duration = String(options.duration ?? 5);

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    let result: { data: { video: { url: string } } };

    if (options.startImagePath && fs.existsSync(options.startImagePath)) {
      // Image-to-video
      const imageBuffer = fs.readFileSync(options.startImagePath);
      const file = new File([imageBuffer], 'start-frame.png', { type: 'image/png' });
      const imageUrl = await fal.storage.upload(file);

      result = (await fal.subscribe('fal-ai/kling-video/v2/pro/image-to-video', {
        input: {
          prompt: options.prompt,
          image_url: imageUrl,
          aspect_ratio: aspectRatio,
          duration,
        },
        pollInterval: 10000,
        logs: true,
      })) as { data: { video: { url: string } } };
    } else {
      // Text-to-video
      result = (await fal.subscribe('fal-ai/kling-video/v2/pro/text-to-video', {
        input: {
          prompt: options.prompt,
          aspect_ratio: aspectRatio,
          duration,
        },
        pollInterval: 10000,
        logs: true,
      })) as { data: { video: { url: string } } };
    }

    const videoUrl = result.data.video.url;

    // Download the video
    const response = await axios({
      url: videoUrl,
      method: 'GET',
      responseType: 'arraybuffer',
    });

    fs.writeFileSync(outputPath, Buffer.from(response.data as ArrayBuffer));
  }
}

export const klingService = new KlingService();
