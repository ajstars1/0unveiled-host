/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@0unveiled/ui", "@0unveiled/lib"],
  experimental: {
    optimizePackageImports: ["@0unveiled/ui"],
  },
  webpack: (config, { isServer }) => {
    // Fix for dynamic require of "react" error
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
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