/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp', '@prisma/client', 'prisma', 'fluent-ffmpeg'],
  },
};

export default nextConfig;
