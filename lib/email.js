// lib/email.js
import nodemailer from 'nodemailer';

const { EMAIL_USER, EMAIL_PASS } = process.env;
if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error('Missing EMAIL_USER or EMAIL_PASS');
}

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

export async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"Digital Dossier" <${EMAIL_USER}>`,
    to,
    subject,
    html
  });
}
