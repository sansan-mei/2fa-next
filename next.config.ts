import withSerwistInit from "@serwist/next";
import { NextConfig } from "next";

const withSerwist = withSerwistInit({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  output: "standalone",
};
export default withSerwist(nextConfig);

/** @requires {生产环境可以用 "@next/bundle-analyzer"先分析一下代码} */
