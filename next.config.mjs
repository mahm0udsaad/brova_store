import createNextIntlPlugin from 'next-intl/plugin'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const withNextIntl = createNextIntlPlugin('./i18n.ts')
const repoRoot = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize package imports for better tree-shaking
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  turbopack: {
    root: repoRoot,
  },
  images: {
    // Enable optimization for better performance
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85, 90],
    // Cache optimized images for 1 year (31536000 seconds)
    minimumCacheTTL: 31536000,
    // Allow SVG files if needed
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "alpozkmftvqjqozkkoyz.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "tempfile.aiquickdraw.com",
        pathname: "/workers/nano/**",
      },
    ],
  },
}

export default withNextIntl(nextConfig)
