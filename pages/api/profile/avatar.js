// pages/api/profile/avatar.js

import { IncomingForm } from "formidable";
import fs from "fs";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false, // let formidable handle multipart
  },
};

// Initialize AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1) Parse the incoming multipart form
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

  // 2) Read + resize the image to 256×256 px PNG
  let resizedBuffer;
  try {
    const buffer = await fs.promises.readFile(file.filepath);
    resizedBuffer = await sharp(buffer).resize(256, 256).png().toBuffer();
  } catch (processErr) {
    console.error("Error processing image:", processErr);
    return res.status(500).json({ error: "Error processing image" });
  }

  // 3) Upload the resized image to S3 under the avatars prefix
  const bucket = process.env.AWS_S3_BUCKET;
  const prefix = process.env.S3_AVATARS_PREFIX; // e.g. "avatars"
  const key = `${prefix}/user-avatar.png`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: resizedBuffer,
        ContentType: "image/png",
      })
    );
  } catch (uploadErr) {
    console.error("Error uploading to S3:", uploadErr);
    return res.status(500).json({ error: "Error uploading avatar" });
  }

  // 4) Persist the S3 key in the Profile table (upsert single profile record)
  let profile;
  try {
    profile = await prisma.profile.upsert({
      where: { id: 1 },
      update: { avatarKey: key },
      create: { avatarKey: key },
    });
  } catch (dbErr) {
    console.error("Error saving avatarKey to DB:", dbErr);
    return res.status(500).json({ error: "Error saving profile data" });
  }

  // 5) Construct the public URL and return it along with DB record
  const region = process.env.AWS_REGION;
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return res.status(200).json({
    success: true,
    data: {
      id:         profile.id,
      avatarKey:  profile.avatarKey,
      avatarUrl:  url,
      createdAt:  profile.createdAt,
      updatedAt:  profile.updatedAt,
    }
  });
}
