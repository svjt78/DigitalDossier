// pages/api/profile.js

import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  // Check if custom site avatar exists locally
  const customAvatarPath = path.join(process.cwd(), "public", "uploads", "site-avatar.png");
  let avatarUrl = "/logo.svg"; // Default to logo.svg

  try {
    // Check if custom avatar file exists
    await fs.promises.access(customAvatarPath);
    avatarUrl = "/uploads/site-avatar.png";
  } catch {
    // Custom avatar doesn't exist, check database for any stored path
    try {
      const profile = await prisma.profile.findFirst();
      if (profile?.avatar_key) {
        // Verify the file still exists
        const storedPath = path.join(process.cwd(), "public", profile.avatar_key);
        try {
          await fs.promises.access(storedPath);
          avatarUrl = profile.avatar_key;
        } catch {
          // File doesn't exist, fall back to logo
          console.log('Stored avatar file not found, using logo.svg');
        }
      }
    } catch (dbErr) {
      console.warn('Database query failed, using default logo:', dbErr);
    }
  }

  // Return site-wide profile information
  res.status(200).json({
    name:       'Digital Dossier',
    email:      'suvodutta.isme@gmail.com',
    avatarUrl,  
    createdAt:  new Date().toISOString(),
    updatedAt:  new Date().toISOString(),
  });
}
