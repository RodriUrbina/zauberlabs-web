import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/de", permanent: false }];
  },
};

export default nextConfig;
