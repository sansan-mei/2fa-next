This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Docker image

The image uses a multi-stage build with Next.js standalone output and a Bun slim
runtime. `.dockerignore` keeps local dependencies and build output out of the
Linux build. Dependencies are installed using the committed lockfile.

Server-side image optimization is disabled, and `sharp` / `@img` are excluded from
the standalone output. Existing images, QR codes, and PWA assets are served
directly. If server-side image resizing is added later, remove both the
`images.unoptimized` setting and these tracing exclusions in `next.config.ts`.

The runtime retains the non-root `appuser` user (UID 1001). Any mounted writable
directories must allow that user to write. Environment files are not
copied into the image; supply runtime configuration separately. Browser-visible
`NEXT_PUBLIC_*` values, if introduced, must be supplied at build time explicitly.

The `BUN_VERSION` build argument defaults to `1`; it can be pinned to a release
with matching regular and slim image tags. Image size and PWA offline behavior
must be verified after a production image is built.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
