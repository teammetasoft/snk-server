const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSms = async (phone, message) => {
  try {
    if (!phone) {
      throw new Error("Phone number is required");
    }

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    return {
      success: true,
      message: "SMS sent successfully",
      sid: response.sid,
    };
  } catch (error) {
    console.error("Twilio SMS Error:", error);
    return { success: false, message: "Failed to send SMS" };
  }
};

const sendSmsOtp = async (phone, otp, name = "User") => {
  const message = `Hello ${name}, your OTP for authentication is ${otp}. 
This OTP is valid for 5 minutes.`;
  //   return await sendSms(phone, message);
  console.log(`Mock OTP for ${phone} is : ${otp}`);

  return { success: true, message: "SMS sent successfully" };
};

const sendNotificationSms = async (phone, title, body) => {
  const message = `${title}\n${body}`;
  return await sendSms(phone, message);
};

module.exports = {
  sendSms,
  sendSmsOtp,
  sendNotificationSms,
};
