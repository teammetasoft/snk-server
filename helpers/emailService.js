const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER,
    pass: process.env.NODEMAILER_PASS,
  },
});


const sendEmail = async (to, subject, html, text = "") => {
  try {
    const info = await transporter.sendMail({
      from: `"Eventive Team" <${process.env.NODEMAILER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email sent: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};


const sendOtpEmail = async (email, otp, type = "verify", name = "User") => {
  const subject =
    type === "reset"
      ? "Reset Password OTP - Eventive"
      : "Email Verification OTP - Eventive";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Hi ${name},</h2>
      <p>Your one-time password (OTP) for ${
        type === "reset" ? "resetting your password" : "email verification"
      } is:</p>
      <h1 style="letter-spacing:4px;color:#007bff;">${otp}</h1>
      <p>This OTP will expire in 5 minutes. Do not share it with anyone.</p>
      <br/>
      <p>Best regards,<br><b>Eventive Team</b></p>
    </div>
  `;

  return await sendEmail(email, subject, html, `Your OTP is ${otp}`);
};

const sendWelcomeEmail = async (email, name = "User") => {
  const subject = "Welcome to Eventive";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Welcome aboard, ${name}!</h2>
      <p>We’re excited to have you join Eventive.</p>
      <p>Explore our features and start your journey today!</p>
      <br/>
      <p>Cheers,<br><b>Eventive Team</b></p>
    </div>
  `;

  return await sendEmail(email, subject, html);
};

const sendNotificationEmail = async (email, subject, message) => {
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <p>${message}</p>
      <br/>
      <p>— Eventive Team</p>
    </div>
  `;

  return await sendEmail(email, subject, html);
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
};
