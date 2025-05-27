// pages/api/profile.js

import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  const prefix = process.env.S3_AVATARS_PREFIX;

  if (!bucket || !region || !prefix) {
    console.error('Missing required env vars for S3');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  // Read the single Profile record (you could filter by user ID if extended)
  let profile;
  try {
    profile = await prisma.profile.findFirst();
  } catch (err) {
    console.error('Database error fetching profile:', err);
    return res.status(500).json({ error: 'Database error' });
  }

  // If no profile or no avatarKey, respond with defaults
  const filenameKey = profile?.avatarKey;
  let avatarUrl = null;
  if (filenameKey) {
    const encodedKey = filenameKey
      .split('/')
      .map(encodeURIComponent)
      .join('/');
    avatarUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
  }

  // Return profile metadata (add more fields as needed)
  res.status(200).json({
    name:       'Suvojit Dutta',
    email:      'suvodutta.isme@gmail.com',
    avatarUrl,  
    createdAt:  profile?.createdAt || null,
    updatedAt:  profile?.updatedAt || null,
  });
}
