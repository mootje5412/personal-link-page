import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  turbopack: {
    root: process.cwd(),
  },
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=0, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
    {
      source: "/manifest.json",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400",
        },
      ],
    },
  ],
};

export default nextConfig;
