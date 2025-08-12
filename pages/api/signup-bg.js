// pages/api/signup-bg.js

export default function handler(req, res) {
    // Public endpoint to return the signup background URL
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    const bgKey = 'avatars/signup-bg.png';
    const signupBgUrl = `https://${bucket}.s3.${region}.amazonaws.com/${bgKey}`;
    res.status(200).json({ signupBgUrl });
  }
  