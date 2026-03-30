/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', '@prisma/client', 'prisma', 'fluent-ffmpeg', 'ffmpeg-static'],
  },
};

export default nextConfig;
