// sendEmail.js
const nodemailer = require("nodemailer");

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS environment variables are not set");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
};

const sendWelcomeEmail = async (user) => {
  try {
    if (!user?.email || !user.email.includes("@")) {
      console.warn("Invalid email, skipping welcome email.");
      return false;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Dance Katta" <${process.env.EMAIL_USER}>`,
      to: user.email.trim().toLowerCase(),
      subject: "Welcome to Dance Katta 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">
          <h2 style="color: #3A5ED4;">Welcome, ${user.firstName || "Dancer"}! 🎉</h2>
          <p>Your account has been successfully created on <strong>Dance Katta</strong>.</p>
          <p>Start your dance journey with us 💃🕺</p>
          <br/>
          <p style="color: gray; font-size: 12px;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent to:", user.email);
    return true;

  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    return false;
  }
};

module.exports = sendWelcomeEmail;
