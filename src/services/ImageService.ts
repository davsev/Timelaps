import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fal } from '@fal-ai/client';

// Map project aspect ratios to Fal.ai image_size values
function mapAspectRatio(ar: string): string {
  const mapping: Record<string, string> = {
    '9:16': 'portrait_16_9',
    '16:9': 'landscape_16_9',
    '1:1': 'square',
    '4:5': 'portrait_4_3',
  };
  return mapping[ar] ?? 'portrait_16_9';
}

class ImageService {
  async generateImage(prompt: string, aspectRatio: string, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      console.warn('FAL_KEY not set — using placeholder image');
      await this.writePlaceholder(outputPath, aspectRatio);
      return;
    }

    fal.config({ credentials: falKey });

    try {
      const result = await fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt,
          image_size: mapAspectRatio(aspectRatio),
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: false,
        },
      });

      const imageUrl: string = (result.data as any)?.images?.[0]?.url;
      if (!imageUrl) throw new Error('Fal.ai returned no image URL');

      // Download the image to disk
      const response = await axios({ url: imageUrl, method: 'GET', responseType: 'arraybuffer' });
      fs.writeFileSync(outputPath, Buffer.from(response.data as ArrayBuffer));
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Image generation failed: ${msg}`);
    }
  }

  private async writePlaceholder(outputPath: string, aspectRatio: string): Promise<void> {
    const width = aspectRatio === '9:16' ? 576 : 1024;
    const height = aspectRatio === '9:16' ? 1024 : 576;
    try {
      const sharp = (await import('sharp')).default;
      await sharp({
        create: { width, height, channels: 3, background: { r: 30, g: 60, b: 90 } },
      })
        .png()
        .toFile(outputPath);
    } catch {
      fs.writeFileSync(
        outputPath,
        Buffer.from(
          '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
          '2e00000000c4944415478016360f8cfc00000000200013e4f6900000000049454e44ae426082',
          'hex'
        )
      );
    }
  }
}

export const imageService = new ImageService();
