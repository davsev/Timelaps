// Run with: node test-kling.mjs
// Tests your Kling API credentials and shows the full response

import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

// Load .env manually
try {
  const env = readFileSync('.env', 'utf8');
  for (const line of env.split('\n')) {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  }
} catch {
  console.error('No .env file found. Create one with KLING_ACCESS_KEY_ID and KLING_SECRET_KEY');
  process.exit(1);
}

const accessKeyId = process.env.KLING_ACCESS_KEY_ID;
const secretKey = process.env.KLING_SECRET_KEY;
const model = process.env.KLING_MODEL ?? 'kling-v1-6';
const mode = process.env.KLING_MODE ?? 'std';

if (!accessKeyId || !secretKey) {
  console.error('Missing KLING_ACCESS_KEY_ID or KLING_SECRET_KEY in .env');
  process.exit(1);
}

console.log('Credentials found');
console.log(`   KLING_ACCESS_KEY_ID: ${accessKeyId.slice(0, 8)}...`);
console.log(`   KLING_MODEL: ${model}, KLING_MODE: ${mode}`);

// Generate JWT
const now = Math.floor(Date.now() / 1000);
const token = jwt.sign(
  { iss: accessKeyId, exp: now + 1800, nbf: now - 5 },
  secretKey,
  { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } }
);
console.log(`\nJWT generated: ${token.slice(0, 40)}...`);

// Make test API call
console.log('\nCalling Kling API (text2video)...');
const body = {
  model_name: model,
  mode,
  prompt: 'A simple test: empty plot of land, wide angle, daylight',
  aspect_ratio: '9:16',
  duration: '5',
};

const res = await fetch('https://api.klingai.com/v1/videos/text2video', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const responseText = await res.text();
console.log(`\nHTTP Status: ${res.status} ${res.statusText}`);
console.log('Response body:');
try {
  console.log(JSON.stringify(JSON.parse(responseText), null, 2));
} catch {
  console.log(responseText);
}

if (res.ok) {
  console.log('\nSuccess! API is working correctly.');
} else {
  console.log('\nAPI call failed. See response above for details.');
  if (res.status === 403) {
    console.log('\n403 Forbidden — possible causes:');
    console.log('   1. API access not enabled on your Kling account');
    console.log('   2. Go to https://klingai.com/developer and enable API access');
    console.log('   3. Your plan does not support this model/mode');
    console.log('   4. Try KLING_MODEL=kling-v1 KLING_MODE=std in your .env');
  }
  if (res.status === 401) {
    console.log('\n401 Unauthorized — your KLING_ACCESS_KEY_ID or KLING_SECRET_KEY is wrong');
  }
}
