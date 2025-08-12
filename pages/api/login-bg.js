// File: pages/api/login-bg.js

export default function handler(req, res) {
  // Public endpoint to return the login background URL
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  const bgKey = 'avatars/login-bg.png';
  const loginBgUrl = `https://${bucket}.s3.${region}.amazonaws.com/${bgKey}`;
  res.status(200).json({ loginBgUrl });
}
