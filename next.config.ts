
import type {NextConfig} from 'next';
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
  register: false, // We will handle registration manually
  skipWaiting: true,
});


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [],
  },
  ...(process.env.STUDIO_ORIGIN && {
    experimental: {
      allowedDevOrigins: [process.env.STUDIO_ORIGIN],
    },
  }),
};

export default withPWA(nextConfig);
