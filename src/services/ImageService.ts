import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fal } from '@fal-ai/client';

function mapAspectRatio(ar: string): string {
  const mapping: Record<string, string> = {
    '9:16': 'portrait_16_9',
    '16:9': 'landscape_16_9',
    '1:1': 'square',
    '4:5': 'portrait_4_3',
  };
  return mapping[ar] ?? 'portrait_16_9';
}

function getFalClient() {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY environment variable is not set');
  fal.config({ credentials: key });
  return fal;
}

async function downloadToFile(url: string, outputPath: string): Promise<void> {
  const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });
  fs.writeFileSync(outputPath, Buffer.from(response.data as ArrayBuffer));
}

class ImageService {
  /**
   * Stage 0: generate the bare starting image from a text prompt.
   */
  async generateFromText(prompt: string, aspectRatio: string, outputPath: string): Promise<void> {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const client = getFalClient();

    const result = await client.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt,
        image_size: mapAspectRatio(aspectRatio),
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      },
    });

    const imageUrl: string = (result.data as any)?.images?.[0]?.url;
    if (!imageUrl) throw new Error('Fal.ai (flux/schnell) returned no image URL');
    await downloadToFile(imageUrl, outputPath);
  }

  /**
   * Stages 1+: edit the previous stage image, adding the new elements described
   * in `diffDescription`. Uses flux-pro/kontext for consistent context-aware editing.
   */
  async generateFromImage(
    prevImagePath: string,
    diffDescription: string,
    aspectRatio: string,
    outputPath: string
  ): Promise<void> {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const client = getFalClient();

    // Upload the previous image to Fal.ai storage to get a URL
    const imageBuffer = fs.readFileSync(prevImagePath);
    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
    const imageUrl = await client.storage.upload(imageBlob);

    const result = await client.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        prompt: diffDescription,
        image_url: imageUrl,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: 'png',
      },
    });

    const outputUrl: string = (result.data as any)?.images?.[0]?.url;
    if (!outputUrl) throw new Error('Fal.ai (flux-pro/kontext) returned no image URL');
    await downloadToFile(outputUrl, outputPath);
  }
}

export const imageService = new ImageService();
