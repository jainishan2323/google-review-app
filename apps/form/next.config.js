/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  // Per-icon tree-shaking for lucide-react instead of pulling the barrel.
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Business logos are arbitrary external URLs the owner pastes in the dashboard,
  // so the host is unknown ahead of time. Route them through next/image to
  // resize + serve WebP/AVIF from our own domain. Wildcard host = the optimizer
  // will proxy any image origin (acceptable: logos are set by trusted owners).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
