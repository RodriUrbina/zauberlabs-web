import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/de", permanent: false }];
  },
  // BL-051: the stats endpoint checks beacons against the published articles, so it needs the content files.
  outputFileTracingIncludes: {
    "/api/m": ["./content/blog/**/*"],
  },
};

export default nextConfig;
