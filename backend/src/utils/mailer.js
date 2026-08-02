const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendResetEmail = async (toEmail, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset?token=${resetToken}`;
  
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Productivity Hub'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Reset Your Password - Productivity Hub",
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f3f4f6; padding: 40px; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #111827; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">
            Password Reset Request
          </h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
            We received a request to reset your password. Don't worry, we've got you covered. Click the button below to set up a new password for your account.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 16px 32px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.5);">
            Reset Password
          </a>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Productivity Hub. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending reset email:", error);
    return false;
  }
};

module.exports = {
  sendResetEmail
};
