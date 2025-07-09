// next.config.ts
import type { NextConfig } from "next";

// Read from your .env
const bucket        = process.env.AWS_S3_BUCKET!;
const region        = process.env.AWS_REGION!;
const s3Host        = `${bucket}.s3.${region}.amazonaws.com`;
const avatarsPrefix = process.env.S3_AVATARS_PREFIX!;
const imgPrefix     = process.env.S3_CONTENT_IMAGES_PREFIX!;
const pdfPrefix     = process.env.S3_CONTENT_PDFS_PREFIX!;

const nextConfig: NextConfig = {
  images: {
    // Allow loading from your S3 bucket host
    domains: [s3Host],
    // Allow loading specific prefixes via remotePatterns
    remotePatterns: [
      {
        protocol: "https",
        hostname: s3Host,
        pathname: `/${avatarsPrefix}/**`,
      },
      {
        protocol: "https",
        hostname: s3Host,
        pathname: `/${imgPrefix}/**`,
      },
      {
        protocol: "https",
        hostname: s3Host,
        pathname: `/${pdfPrefix}/**`,
      },
    ],
  },

  // Expose your AWS bucket & prefixes to the browser
  env: {
    NEXT_PUBLIC_S3_BUCKET: process.env.AWS_S3_BUCKET,
    NEXT_PUBLIC_AWS_REGION: process.env.AWS_REGION,
    NEXT_PUBLIC_S3_AVATARS_PREFIX: avatarsPrefix,
    NEXT_PUBLIC_S3_CONTENT_IMAGES_PREFIX: imgPrefix,
    NEXT_PUBLIC_S3_CONTENT_PDFS_PREFIX: pdfPrefix,
  },

  // …other existing config options
};

export default nextConfig;
