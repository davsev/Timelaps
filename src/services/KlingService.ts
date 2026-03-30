import fs from 'fs';
import path from 'path';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const KLING_API_BASE = 'https://api.klingai.com';
const KLING_MODEL = process.env.KLING_MODEL ?? 'kling-v1-6';
const KLING_MODE = process.env.KLING_MODE ?? 'std';

function mapAspectRatio(ar: string): string {
  const mapping: Record<string, string> = {
    '9:16': '9:16',
    '16:9': '16:9',
    '1:1': '1:1',
    '4:5': '4:5',
  };
  return mapping[ar] ?? '9:16';
}

// Generate a short-lived JWT for Kling API authentication
function generateToken(): string {
  const accessKeyId = process.env.KLING_ACCESS_KEY_ID;
  const secretKey = process.env.KLING_ACCESS_KEY_SECRET ?? process.env.KLING_SECRET_KEY;

  if (!accessKeyId || !secretKey) {
    throw new Error(
      'Missing KLING_ACCESS_KEY_ID or KLING_ACCESS_KEY_SECRET environment variables'
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: accessKeyId,
    exp: now + 1800, // 30 min validity
    nbf: now - 5,
  };

  return jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' },
  } as jwt.SignOptions);
}

function authHeaders() {
  return {
    Authorization: `Bearer ${generateToken()}`,
    'Content-Type': 'application/json',
  };
}

// Translate raw axios/HTTP errors into human-readable messages
function friendlyError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data;
    const apiMsg: string =
      body?.message ?? body?.error ?? body?.msg ?? JSON.stringify(body) ?? '';

    switch (status) {
      case 400:
        return new Error(
          `Bad request to Kling API: ${apiMsg || 'Invalid parameters sent. Check your prompt or aspect ratio.'}`
        );
      case 401:
        return new Error(
          'Unauthorized: Your KLING_ACCESS_KEY_ID or KLING_SECRET_KEY is incorrect. Check your .env file.'
        );
      case 403:
        return new Error(
          `Forbidden: Your Kling account does not have API access to model "${KLING_MODEL}" (${KLING_MODE} mode). ` +
          `Visit https://klingai.com/developer to verify API is enabled and your plan supports this model. ` +
          (apiMsg ? `API said: ${apiMsg}` : '')
        );
      case 429:
        return new Error(
          'Rate limited by Kling API: Too many requests. Wait a moment and try again.'
        );
      case 500:
      case 502:
      case 503:
        return new Error(
          `Kling API server error (${status}): The service may be temporarily unavailable. Try again shortly.`
        );
      default:
        return new Error(
          `Kling API error (HTTP ${status ?? 'unknown'}): ${apiMsg || error.message}`
        );
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}

// Poll until task is done, return video URL
async function pollTask(endpoint: string, taskId: string): Promise<string> {
  const url = `${KLING_API_BASE}${endpoint}/${taskId}`;

  for (let attempt = 0; attempt < 120; attempt++) {
    await new Promise((r) => setTimeout(r, 10_000)); // 10s between polls

    let res;
    try {
      res = await axios.get(url, { headers: authHeaders() });
    } catch (err) {
      throw friendlyError(err);
    }
    const data = res.data?.data;
    const status: string = data?.task_status;

    if (status === 'succeed') {
      const videoUrl: string = data?.task_result?.videos?.[0]?.url;
      if (!videoUrl) throw new Error('Kling task succeeded but no video URL returned');
      return videoUrl;
    }

    if (status === 'failed') {
      const reason = data?.task_status_msg ?? 'unknown error';
      throw new Error(`Kling task failed: ${reason}`);
    }
    // "processing" or "submitted" — keep polling
  }

  throw new Error('Kling task timed out after 20 minutes');
}

interface KlingOptions {
  prompt: string;
  startImagePath?: string;
  aspectRatio: string;
  duration?: number;
}

class KlingService {
  async generateVideo(options: KlingOptions, outputPath: string): Promise<void> {
    const aspectRatio = mapAspectRatio(options.aspectRatio);
    const duration = String(options.duration ?? 5);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    let videoUrl: string;

    try {
      if (options.startImagePath && fs.existsSync(options.startImagePath)) {
        // ── Image-to-video ────────────────────────────────────────────────────
        const imageBuffer = fs.readFileSync(options.startImagePath);
        const imageBase64 = imageBuffer.toString('base64');
        const ext = path.extname(options.startImagePath).slice(1) || 'png';

        const body = {
          model_name: KLING_MODEL,
          mode: KLING_MODE,
          image: `data:image/${ext};base64,${imageBase64}`,
          prompt: options.prompt,
          aspect_ratio: aspectRatio,
          duration,
        };

        const res = await axios.post(
          `${KLING_API_BASE}/v1/videos/image2video`,
          body,
          { headers: authHeaders() }
        );

        const taskId: string = res.data?.data?.task_id;
        if (!taskId) throw new Error('No task_id returned from Kling image2video API');

        videoUrl = await pollTask('/v1/videos/image2video', taskId);
      } else {
        // ── Text-to-video ─────────────────────────────────────────────────────
        const body = {
          model_name: KLING_MODEL,
          mode: KLING_MODE,
          prompt: options.prompt,
          aspect_ratio: aspectRatio,
          duration,
        };

        const res = await axios.post(
          `${KLING_API_BASE}/v1/videos/text2video`,
          body,
          { headers: authHeaders() }
        );

        const taskId: string = res.data?.data?.task_id;
        if (!taskId) throw new Error('No task_id returned from Kling text2video API');

        videoUrl = await pollTask('/v1/videos/text2video', taskId);
      }

      // Download the generated video
      const response = await axios({ url: videoUrl, method: 'GET', responseType: 'arraybuffer' });
      fs.writeFileSync(outputPath, Buffer.from(response.data as ArrayBuffer));
    } catch (error) {
      throw friendlyError(error);
    }
  }
}

export const klingService = new KlingService();
