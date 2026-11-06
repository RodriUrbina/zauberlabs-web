import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/de", permanent: false }];
  },
  // BL-051: the stats endpoint checks beacons against the published articles, so it needs the content files.
  outputFileTracingIncludes: {
    "/api/m": ["./content/blog/**/*"],
    // BL-118: the Instagram publisher, the comment digest and the slide route read the post queue at run time.
    "/api/instagram/publish": ["./content/social/instagram/**/*"],
    "/api/instagram/comments": ["./content/social/instagram/**/*"],
    "/social/instagram/[post]/[file]": ["./content/social/instagram/**/*"],
  },
};

export default nextConfig;
