/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  experimental: {
    optimizePackageImports: [],
    // Enable React Compiler for better performance (stable in Next.js 15.5+)
    reactCompiler: true,
  },
  // Server external packages (moved from experimental in Next.js 15.5+)
  serverExternalPackages: ['@tanstack/react-query'],
  // Enable static optimization
  output: 'standalone',
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Webpack configuration (for non-Turbopack builds)
  webpack: (config, { isServer }) => {
    // Fix for dynamic require of "react" error
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          reactQuery: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            name: 'react-query',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  // Turbopack configuration (for dev with --turbopack)
  turbopack: {
    // Let Next.js handle SVG files natively
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Enable image optimization
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable compression
  compress: true,
  // Enable powered by header removal
  poweredByHeader: false,
  // Enable strict mode
  reactStrictMode: true,
};

export default nextConfig; 