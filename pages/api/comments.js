// File: pages/api/comments.js

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { renderCommentAlert } from '@/lib/emailTemplates'

export default async function handler(req, res) {
  // 1) Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postId, name, email, content } = req.body;

  // 2) Basic validation
  if (!postId || !name || !email || !content) {
    return res
      .status(400)
      .json({ error: 'postId, name, email and content are required' });
  }

  try {
    // 3) Save the comment
    const comment = await prisma.comment.create({
      data: { postId, name, email, content },
    });

    // 4) Compose the alert email HTML
    const html = renderCommentAlert({
      commenterName: name,
      commenterEmail: email,
      commentContent: content,
      // adjust depending on how you build your permalink
      postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/blog/${postId}`,
    });

    // 5) Send it off to your admin inbox
    await sendEmail(
      process.env.ADMIN_EMAIL || 'suvodutta.isme@gmail.com',
      `New comment on your post`,
      html
    );

    return res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ error: 'Failed to create comment' });
  }
}
