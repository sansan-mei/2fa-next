import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

// Supplied by Next's webpack hook before Serwist generates the precache manifest.
let buildRevision: string;

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  manifestTransforms: [async (entries) => {
    if (!buildRevision) throw new Error("Missing Next.js build ID for the offline app shell");
    return {
      // Keep Serwist's public-file and JS/CSS entries; refresh HTML on every release.
      // HTML is fetched during SW installation, so its byte size isn't known here.
      manifest: [...entries.filter((entry) => entry.url !== "/"), { url: "/", revision: buildRevision, size: 0 }],
      warnings: [],
    };
  }],
});

const nextConfig: NextConfig = {
  output: "standalone",
  webpack(config, { buildId }) {
    buildRevision = buildId;
    return config;
  },
  // Images and QR codes are served directly; no server-side image resizing is used.
  images: { unoptimized: true },
  outputFileTracingExcludes: {
    // Match both route traces and the next-server trace in Next.js 15.
    "**": ["**/node_modules/sharp/**/*", "**/node_modules/@img/**/*"],
  },
};
export default withSerwist(nextConfig);

/** @requires {生产环境可以用 "@next/bundle-analyzer"先分析一下代码} */
