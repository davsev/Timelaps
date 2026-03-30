import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import axios from 'axios';

function generateToken(): string {
  const accessKeyId = process.env.KLING_ACCESS_KEY_ID;
  const secretKey = process.env.KLING_ACCESS_KEY_SECRET ?? process.env.KLING_SECRET_KEY;
  if (!accessKeyId || !secretKey) throw new Error('Missing Kling credentials');
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign({ iss: accessKeyId, exp: now + 1800, nbf: now - 5 }, secretKey, {
    algorithm: 'HS256',
    header: { alg: 'HS256', typ: 'JWT' },
  } as import('jsonwebtoken').SignOptions);
}

export async function GET() {
  // Clip counts from DB
  const [totalClips, doneClips] = await Promise.all([
    db.clip.count(),
    db.clip.count({ where: { status: 'done' } }),
  ]);

  // Kling credit balance
  let credits: { total: number; used: number; remaining: number } | null = null;
  try {
    const res = await axios.get('https://api.klingai.com/v1/account/costs', {
      headers: {
        Authorization: `Bearer ${generateToken()}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    });
    const data = res.data?.data;
    if (data) {
      credits = {
        total: data.total_quantity ?? data.total ?? 0,
        used: data.used_quantity ?? data.used ?? 0,
        remaining: data.remaining_quantity ?? data.remaining ?? (data.total_quantity ?? 0) - (data.used_quantity ?? 0),
      };
    }
  } catch {
    // Credits unavailable — don't fail the whole request
  }

  return NextResponse.json({ totalClips, doneClips, credits });
}
