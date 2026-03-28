import fs from 'fs';
import path from 'path';

class ImageService {
  /**
   * Generate a placeholder image for a given prompt and aspect ratio.
   * Uses sharp to create a solid-color PNG.
   */
  async generateImage(
    prompt: string,
    aspectRatio: string,
    outputPath: string
  ): Promise<void> {
    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    const width = aspectRatio === '9:16' ? 576 : 1024;
    const height = aspectRatio === '9:16' ? 1024 : 576;

    try {
      // Dynamically import sharp to avoid issues with server-side rendering
      const sharp = (await import('sharp')).default;

      await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 30, g: 60, b: 90 }, // dark blue placeholder
        },
      })
        .png()
        .toFile(outputPath);
    } catch (sharpError) {
      // Fallback: write a minimal valid PNG if sharp is unavailable
      console.warn('Sharp unavailable, writing minimal PNG fallback:', sharpError);
      await this.writeMinimalPng(outputPath);
    }
  }

  /**
   * Minimal fallback: write a 1x1 pixel dark blue PNG
   */
  private async writeMinimalPng(outputPath: string): Promise<void> {
    // Minimal 1x1 dark blue PNG (raw bytes)
    const pngBytes = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
        '2e00000000c4944415478016360f8cfc00000000200013e4f6900000000049454e44ae426082',
      'hex'
    );
    fs.writeFileSync(outputPath, pngBytes);
  }
}

export const imageService = new ImageService();
