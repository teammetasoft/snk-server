const nodemailer = require("nodemailer");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const OTPVerification = require("../model/OTPVerifyModel");

// Nodemailer configuration

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER,
    pass: process.env.NODEMAILER_PASS,
  },
});

const sendMailResetPass = async (email, res, link, name) => {
  try {
    const OTP = await Math.floor(100000 + Math.random() * 900000).toString();
    // console.log(OTP)

    const hashOtp = await bcrypt.hash(OTP, 10);
    const user = await OTPVerification.findOne({ user: email });
    if (!user) {
      const data = new OTPVerification({
        user: email,
        otp: hashOtp,
        created: Date.now(),
        Expiry: Date.now() + 100000,
      });
      await data.save();
    } else {
      await OTPVerification.updateOne({ user: email }, { otp: hashOtp });
    }

    let info;
    if (link) {
      const token = jwt.sign({ email, OTP }, process.env.JWT_AUTH_SECRET, {
        expiresIn: "5m",
      });
      // console.log("token",token);
      // send mail with defined transport object
      info = await transporter.sendMail({
        from: process.env.NODEMAILER, // sender address
        to: email, // list of receivers
        subject: "MEA Password Reset Link", // Subject line
        text: `Hello User Your link to reset your password is  ${process.env.FRONT_END_RESET_PASSWORD}/${token} `,
        html: `<body style="width: 100%; max-width: 600px; margin: auto;">
  <table style="width: 100%;" id="resetTable">
    <tr style="background-color: #000000; padding: 20px;">
      <th colspan="2" style="padding: 10px; text-align: center;">
        <img style="width: 250px;" src="https://zeeqr2.s3.ap-south-1.amazonaws.com/images/zeeqrGoldenlogo4x.png" alt="Zeeqr Logo" style="max-width: 100%; height: auto;">
      </th>
    </tr>
    <tr>
      <td colspan="2" style="padding: 20px;">
        <h1 style="font-weight: 600; font-size: 20px; color: #000000; text-align: center;">Password Reset!</h1>
        <h2 style="font-weight: 500; font-size: 16px; color: #000000;">Hello  ${name},</h2>
        <p style="font-weight: 400; font-size: 12px; color: #000000;">
          If you've lost your password or wish to reset it, use the link below to get started.
        </p>
        <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
          <a href="${process.env.FRONT_END_RESET_PASSWORD}/${token}" style="text-decoration: none;">
            <button style="background: linear-gradient(270deg, #9C720A 0%, #D7AD44 100%); border: none; color: #FFFFFF; padding: 10px 20px; font-size: 16px; font-weight: 500; border-radius: 7px; cursor: pointer;">
              Reset your password
            </button>
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <hr style="height:2px;background: linear-gradient(270deg, #D9AF46 0.13%, #9A7008 100.13%); border: none;">
      </td>
    </tr>
    <tr>
      <td colspan="2" style="background-color: #ECEAEA; padding: 30px; text-align: center;">
        <p style="font-size: 14px; color: #1E1E1E; margin-right: 16px; text-align: center; font-weight: 400;">Need help? Email us at <a href="mailto:sales@zeeqr.com" target="_blank" style="color: #1E1E1E; text-decoration: none;"><span style="font-weight: 700;">sales@zeeqr.com</span></a> or call <a href="tel:+971505363704" style="color: #1E1E1E; text-decoration: none;"><span style="font-weight: 700;">+971 50 636 3704</span></a></p>
        <div style="white-space: nowrap;">
          <a style="text-decoration: none;" href="https://www.facebook.com/zeeqrme/" target="_blank">
            <img src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateFB.png" alt="Facebook Icon" style="width: 42px; height: 42px;">
          </a>
          <a style="text-decoration: none;" href="https://www.instagram.com/zeeqr.co/" target="_blank">
            <img src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateInsta.png" alt="Instagram Icon" style="width: 42px; height: 42px;">
          </a>
          <a style="text-decoration: none;" href="https://twitter.com/ZEEQR299904/" target="_blank">
            <img src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateTwitter.png" alt="Twitter Icon" style="width: 42px; height: 42px;">
          </a>
          <a style="text-decoration: none;" href="https://www.linkedin.com/company/zeeqr/" target="_blank">
            <img src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateLinkedIn.png" alt="LinkedIn Icon" style="width: 42px; height: 42px;">
          </a>
          <a style="text-decoration: none;" href="https://wa.me/+971505363704?text=Hi%2C" target="_blank">
            <img src="https://zeeqr2.s3.ap-south-1.amazonaws.com/emailTemplateWhatsup.png" alt="WhatsApp Icon" style="width: 42px; height: 42px;">
          </a>
        </div>
      </td>
    </tr>
  </table>
</body>`, // plain text body
      });
      // console.log(info, "foeget 11111111111111111111111");
    } else {
      // send mail with defined transport object
      info = await transporter.sendMail({
        from: process.env.NODEMAILER, // sender address
        to: email, // list of receivers
        subject: "One Time Password for Eventive Events", // Subject line
        text: `Hello User Your six digit OTP for authentication is ${OTP} `, // plain text body
        html: `<p>Hello User Your six digit OTP for authentication is <b>${OTP}</b></p>`, // html body
      });
      // console.log(info, "11111111111111111111111");
    }

    if (info.messageId) {
      // console.log('in ifffffff');
      res.status(200).json({ success: true, message: "Otp send to mail" });
    } else {
      // console.log('in elllseeee');
      res.status(402).json("something went wrong");
    }
  } catch (error) {
    console.log(error, "send otp error");
    res.status(500).json(error);
  }
};

module.exports = {
  sendMailResetPass,
};
