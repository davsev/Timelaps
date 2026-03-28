import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

class FfmpegService {
  /**
   * Extract the last frame of a video as PNG
   */
  async extractLastFrame(videoPath: string, outputPath: string): Promise<void> {
    const cmd = `ffmpeg -sseof -3 -i "${videoPath}" -update 1 -q:v 1 "${outputPath}" -y`;
    try {
      await execAsync(cmd);
    } catch (error) {
      throw new Error(`Failed to extract last frame from ${videoPath}: ${error}`);
    }
  }

  /**
   * Concatenate multiple MP4 files into one
   */
  async concatenateClips(videoPaths: string[], outputPath: string): Promise<void> {
    if (videoPaths.length === 0) {
      throw new Error('No video paths provided for concatenation');
    }

    if (videoPaths.length === 1) {
      // Just copy the single file
      fs.copyFileSync(videoPaths[0], outputPath);
      return;
    }

    // Write a temp concat.txt file
    const tmpDir = os.tmpdir();
    const concatFile = path.join(tmpDir, `concat-${Date.now()}.txt`);
    const concatContent = videoPaths.map((p) => `file '${p}'`).join('\n');
    fs.writeFileSync(concatFile, concatContent, 'utf8');

    try {
      const cmd = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}" -y`;
      await execAsync(cmd);
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(concatFile);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  /**
   * Mix background music into a video (reduce music to 30% volume)
   */
  async addBackgroundMusic(
    videoPath: string,
    musicPath: string,
    outputPath: string
  ): Promise<void> {
    const cmd = `ffmpeg -i "${videoPath}" -i "${musicPath}" -filter_complex "[1:a]volume=0.3[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest "${outputPath}" -y`;
    try {
      await execAsync(cmd);
    } catch (error) {
      throw new Error(`Failed to add background music: ${error}`);
    }
  }

  /**
   * Full render: concatenate clips + optionally add music
   */
  async renderTimelapse(
    videoPaths: string[],
    musicPath: string | null,
    outputPath: string
  ): Promise<void> {
    if (videoPaths.length === 0) {
      throw new Error('No video clips to render');
    }

    if (musicPath) {
      // First concatenate into a temp file, then add music
      const tmpDir = os.tmpdir();
      const tempConcat = path.join(tmpDir, `timelapse-concat-${Date.now()}.mp4`);
      try {
        await this.concatenateClips(videoPaths, tempConcat);
        await this.addBackgroundMusic(tempConcat, musicPath, outputPath);
      } finally {
        try {
          fs.unlinkSync(tempConcat);
        } catch {
          // ignore cleanup errors
        }
      }
    } else {
      // Just concatenate
      await this.concatenateClips(videoPaths, outputPath);
    }
  }
}

export const ffmpegService = new FfmpegService();
