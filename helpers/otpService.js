const bcrypt = require("bcrypt");
const OTPVerification = require("../model/OTPVerifyModel");

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const buildOTP = async (identifier) => {
  try {
    const OTP =
      process.env.NODE_ENV === "production" ? generateOTP() : "123456";
    const hashedOtp = await bcrypt.hash(OTP, 10);

    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Create or update existing OTP record
    await OTPVerification.findOneAndUpdate(
      { user: identifier },
      { otp: hashedOtp, created: Date.now(), expiry },
      { upsert: true, new: true }
    );

    // Return OTP for further use (email/SMS sending)
    return OTP;
  } catch (error) {
    console.error("Build OTP Error:", error);
    return { success: false, message: "Failed to generate OTP" };
  }
};

const verifyOtp = async (identifier, otp) => {
  try {
    const record = await OTPVerification.findOne({ user: identifier });
    if (!record)
      return { success: false, message: "Invalid user or OTP not found" };

    const isMatch = await bcrypt.compare(otp.toString(), record.otp);
    if (!isMatch) return { success: false, message: "Invalid OTP" };

    if (record.expiry < Date.now())
      return { success: false, message: "OTP expired" };

    await OTPVerification.deleteOne({ user: identifier }); // cleanup after success

    return { success: true, message: "OTP verified successfully" };
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return { success: false, message: "Server error" };
  }
};

module.exports = { buildOTP, verifyOtp };
