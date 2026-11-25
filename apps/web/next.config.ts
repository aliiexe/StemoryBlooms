import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["@stemory/ui"],
  serverExternalPackages: [],
  images:{remotePatterns:[{protocol:'https',hostname:'*.public.blob.vercel-storage.com',pathname:'/uploads/**'}]},
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
      ...['/admin/:path*','/account/:path*','/checkout/:path*','/track'].map(source=>({source,headers:[{key:'Cache-Control',value:'private, no-store, max-age=0'},{key:'X-Robots-Tag',value:'noindex, nofollow, noarchive'},{key:'Referrer-Policy',value:'no-referrer'}]})),
      { source: '/subscriptions/:path*', headers: [
        { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
      ] },
      { source: '/receipt/:path*', headers: [
        { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
      ] },
    ];
  },
};

export default nextConfig;
