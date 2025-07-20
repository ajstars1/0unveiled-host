/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@0unveiled/ui", "@0unveiled/lib"],
  experimental: {
    optimizePackageImports: ["@0unveiled/ui"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig; 