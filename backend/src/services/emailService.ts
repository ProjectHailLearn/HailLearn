import nodemailer from 'nodemailer';

const isConfigured = (): boolean =>
  !!process.env.SMTP_HOST && !!process.env.SMTP_USER && process.env.SMTP_USER !== 'your_smtp_user';

// Sends via SMTP when configured; otherwise logs the email (development fallback).
export const sendEmail = async (to: string, subject: string, text: string): Promise<boolean> => {
  if (!isConfigured()) {
    console.log(`[email:dev] To: ${to}\nSubject: ${subject}\n${text}`);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({ from: process.env.EMAIL_FROM || 'noreply@haillearn.edu', to, subject, text });
    return true;
  } catch (err) {
    console.error('[email] send failed:', (err as Error).message);
    return false;
  }
};
