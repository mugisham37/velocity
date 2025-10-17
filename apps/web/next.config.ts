import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      'lucide-react',
      'framer-motion',
      'chart.js',
      'react-chartjs-2',
    ],
  },
  
  // Bundle analyzer for production builds
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      if (process.env.NODE_ENV === 'production') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: 'bundle-analyzer-report.html',
          })
        );
      }
      return config;
    },
  }),
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Compression
  compress: true,
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.FRAPPE_BACKEND_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },
  env: {
    FRAPPE_BACKEND_URL:
      process.env.FRAPPE_BACKEND_URL || 'http://localhost:8000',
  },
};

export default nextConfig;
