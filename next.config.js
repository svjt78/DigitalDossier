// next.config.js
const nextConfig = {
  images: {
    // Disable server‐side optimization so the browser fetches directly
    unoptimized: true,

    // You can still declare remotePatterns if you want to enforce
    // valid sources, but optimization is turned off.
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${process.env.AWS_S3_BUCKET || 'digitaldossier-blog'}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com`,
        pathname: `/${process.env.S3_AVATARS_PREFIX || 'avatars'}/**`,
      },
      {
        protocol: "https", 
        hostname: `${process.env.AWS_S3_BUCKET || 'digitaldossier-blog'}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com`,
        pathname: `/${process.env.S3_CONTENT_IMAGES_PREFIX || 'content-images'}/**`,
      },
      {
        protocol: "https",
        hostname: `${process.env.AWS_S3_BUCKET || 'digitaldossier-blog'}.s3.${process.env.AWS_REGION || 'us-east-2'}.amazonaws.com`,
        pathname: `/${process.env.S3_CONTENT_PDFS_PREFIX || 'content-pdfs'}/**`,
      },
    ],
  },

  // Expose your AWS bucket & prefixes to the browser
  env: {
    NEXT_PUBLIC_S3_BUCKET: process.env.AWS_S3_BUCKET || 'digitaldossier-blog',
    NEXT_PUBLIC_AWS_REGION: process.env.AWS_REGION || 'us-east-2',
    NEXT_PUBLIC_S3_AVATARS_PREFIX: process.env.S3_AVATARS_PREFIX || 'avatars',
    NEXT_PUBLIC_S3_CONTENT_IMAGES_PREFIX: process.env.S3_CONTENT_IMAGES_PREFIX || 'content-images',
    NEXT_PUBLIC_S3_CONTENT_PDFS_PREFIX: process.env.S3_CONTENT_PDFS_PREFIX || 'content-pdfs',
  },

  // Disable type checking during build for faster deployments
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
