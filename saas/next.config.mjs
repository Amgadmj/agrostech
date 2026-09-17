/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@deck.gl/core",
    "@deck.gl/layers",
    "@deck.gl/geo-layers",
    "@deck.gl/react",
    "@deck.gl/extensions",
  ],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

export default nextConfig;
