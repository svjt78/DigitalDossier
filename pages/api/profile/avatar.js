// pages/api/profile/avatar.js

import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isSuperUser as serverIsSuperUser } from "@/lib/auth-utils";

export const config = {
  api: {
    bodyParser: false, // let formidable handle multipart
  },
};

const ADMIN_EMAIL = 'suvodutta.isme@gmail.com';

/**
 * Validate if the request is from an authenticated admin user
 */
async function validateAdminAccess(req) {
  // Check if user is authenticated
  const user = await getUserFromToken(req);
  if (!user) {
    return { isValid: false, error: 'Authentication required' };
  }

  // Check if user email matches admin email
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    console.warn(`🚫 Unauthorized avatar upload attempt from: ${user.email}`);
    return { isValid: false, error: 'Admin access required' };
  }

  console.log(`✅ Admin access validated for: ${user.email}`);
  return { isValid: true, user };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // 1) Validate admin access first
  const validation = await validateAdminAccess(req);
  if (!validation.isValid) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Only the administrator can update the site avatar'
    });
  }

  // 2) Parse the incoming multipart form
  const form = new IncomingForm();
  form.keepExtensions = true;

  let files;
  try {
    ({ files } = await new Promise((resolve, reject) =>
      form.parse(req, (err, fields, files) =>
        err ? reject(err) : resolve({ fields, files })
      )
    ));
  } catch (parseErr) {
    console.error("Error parsing form:", parseErr);
    return res.status(500).json({ error: "Error parsing form data" });
  }

  const file = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;
  if (!file) {
    return res.status(400).json({ error: "No avatar file uploaded" });
  }

  // 3) Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ 
      error: "Invalid file type", 
      message: "Only JPEG, PNG, GIF, and WebP images are allowed" 
    });
  }

  // 4) Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return res.status(400).json({ 
      error: "File too large", 
      message: "Avatar must be smaller than 5MB" 
    });
  }

  // 5) Read + resize the image to 256×256 px PNG
  let resizedBuffer;
  try {
    const buffer = await fs.promises.readFile(file.filepath);
    resizedBuffer = await sharp(buffer).resize(256, 256).png().toBuffer();
  } catch (processErr) {
    console.error("Error processing image:", processErr);
    return res.status(500).json({ error: "Error processing image" });
  }

  // 6) Save the resized image to local public/uploads directory
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const avatarPath = path.join(uploadsDir, "site-avatar.png");

  try {
    // Ensure uploads directory exists
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    
    // Write the resized image
    await fs.promises.writeFile(avatarPath, resizedBuffer);
    console.log(`✅ Avatar saved to: ${avatarPath}`);
  } catch (saveErr) {
    console.error("Error saving avatar locally:", saveErr);
    return res.status(500).json({ error: "Error saving avatar" });
  }

  // 7) Update the Profile table with local path
  const avatarUrl = "/uploads/site-avatar.png";
  
  let profile;
  try {
    profile = await prisma.profile.upsert({
      where: { id: 1 },
      update: { avatar_key: avatarUrl },
      create: { avatar_key: avatarUrl },
    });
    console.log(`✅ Profile updated in database with avatar: ${avatarUrl}`);
  } catch (dbErr) {
    console.error("Error saving avatar_key to DB:", dbErr);
    return res.status(500).json({ error: "Error saving profile data" });
  }

  // 8) Clean up temporary file
  try {
    await fs.promises.unlink(file.filepath);
  } catch (cleanupErr) {
    console.warn("Could not clean up temp file:", cleanupErr);
  }

  // 9) Log successful admin upload
  console.log(`🎉 Avatar successfully uploaded by admin: ${validation.user.email}`);

  // 10) Return success response with local URL
  return res.status(200).json({
    success: true,
    message: "Avatar updated successfully",
    data: {
      id:         profile.id,
      avatarKey:  profile.avatar_key,
      avatarUrl:  avatarUrl,
      createdAt:  profile.created_at,
      updatedAt:  profile.updated_at,
      uploadedBy: validation.user.email
    }
  });
}
