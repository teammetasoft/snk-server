//Packages
const bcrypt = require("bcrypt");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");

const User = require("../model/userModel");
const { genAccessToken, genRefreshToken } = require("../helpers/JWT");
const createHttpError = require("http-errors");
const { jwtDecode } = require("jwt-decode"); // Note the destructuring
const OTPVerification = require("../model/OTPVerifyModel");
const { verifyOtp, buildOTP } = require("../helpers/otpService");
const { sendSmsOtp } = require("../helpers/smsService");
const { sendOtpEmail } = require("../helpers/emailService");

//Functions
let refreshTokenArray = [];

const signup = async (req, res) => {
  try {
    let { name, email, phone, dob, password } = req.body;

    name = name?.trim();
    email = email?.trim().toLowerCase();
    phone = phone?.trim();
    dob = dob?.trim();

    if (!name || !email || !phone || !dob || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const fullyVerifiedUser = await User.findOne({
      email,
      phone,
      emailVerified: true,
      phoneVerified: true,
    });

    if (fullyVerifiedUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists and verified",
      });
    }

    const unverifiedUser = await User.findOne({
      email,
      phone,
      $or: [{ emailVerified: false }, { phoneVerified: false }],
    });

    if (unverifiedUser) {
      return res.status(200).json({
        success: true,
        status: "pending-verification",
        userId: unverifiedUser._id,
        message: "User exists but verification pending",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      phone,
      dob,
      password: hashedPassword,
      emailVerified: false,
      phoneVerified: false,
    });

    return res.status(201).json({
      success: true,
      status: "new",
      userId: newUser._id,
      message: "User created successfully. Email & Phone verification required",
    });
  } catch (error) {
    console.error("Signup Flow Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during signup flow",
    });
  }
};

const signupEmail = async (req, res, next) => {
  try {
    const existingUser = await User.findById(req.params.id);
    const { _id,email, name } = existingUser;
    const otp = await buildOTP(email);
    const mailResponse = await sendOtpEmail(email, otp, "verify", name);

    if (!mailResponse.success) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP via email" });
    }

    return res.status(200).json({
      success: true,
      email:email,
      userId:_id,
      message: "OTP sent successfully to your registered email",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "User ID and OTP are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify Email OTP
    const result = await verifyOtp(user.email, otp);
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message,
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      userId: user._id,
      
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const signupPhone = async (req, res, next) => {
  try {
    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (existingUser.emailVerified === false) {
      return res.status(400).json({
        success: false,
        message: "Please verify email before phone verification",
      });
    }

    const { _id,phone, name } = existingUser;

    const otp = await buildOTP(phone);
    const smsResponse = await sendSmsOtp(phone, otp, name);

    if (!smsResponse.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP via SMS",
      });
    }

    return res.status(200).json({
      success: true,
      userId: _id,
      phone,
      message: "OTP sent successfully to your registered phone",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const verifyPhone = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "userId and otp are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // user.phone is the identifier for OTP verification
    const result = await verifyOtp(user.phone, otp);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message,
      });
    }

    await User.updateOne({ _id: userId }, { $set: { phoneVerified: true } });

    return res.status(200).json({
      success: true,
      message: "Phone verified successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // check the email is in the database
    const user = await User.findOne({ email: email });

    if (user) {
      /* ------------------------ block or unblock checking ----------------------- */
      if (user.status === "deactive")
        throw createError.Unauthorized("Your account is suspended.");
      /* ------------------------ delete or noy checking ----------------------- */
      if (user.status === "delete")
        throw createError.Unauthorized("Your account is removed.");
      /* ------------------------ verification checking ----------------------- */
      if (!user.emailVerified||!user.phoneVerified)
        throw createError.Unauthorized("Please complete verification before logging in.");

      /* ------------------------- compareing the password ------------------------ */
      const pswrd = await bcrypt.compare(password, user.password);
      if (!pswrd)
        throw createError.Unauthorized("The entered password is incorrect.");

      /* ---------------- generating acess-token and refresh-token ---------------- */
      const accessToken = await genAccessToken(user);
      const refreshToken = await genRefreshToken(user);

      /* ------------------ set the refresh-token in to an array ------------------ */
      refreshTokenArray.push(refreshToken);

      /* ------------------- set the access-token to the cookies ------------------ */

      res
        .status(200)
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: "strict",
        })
        .json({ success: true, user, refreshToken });
    } else {
      throw createError(401, "Invalid email or password.");
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const sendLoginOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }
    const user = await User.findOne({ phone: phone });

    if (user) {
      // block or unblock checking
      if (user.status === "delete")
        throw createError.Unauthorized("Your Account Is Removed");
      if (user.status === "deactive")
        throw createError.Unauthorized("Your Account Is Suspended");

      const otp = await buildOTP(phone);
      const smsResponse = await sendSmsOtp(phone, otp, user.name);

      if (!smsResponse.success) {
        return res
          .status(500)
          .json({ success: false, message: "Failed to send OTP via SMS" });
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully to your registered phone number",
      });
    } else {
      res.status(200).json({ success: false, message: "user Not Found" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const verifyLoginOtp = async (req, res, next) => {
  const { phone, otp } = req.body;

  try {
    if (!phone || !otp)
      throw createError.BadRequest("Phone and OTP are required");

    // Find the user
    const user = await User.findOne({ phone });
    if (!user) throw createError.Unauthorized("User not found");

    // Status checks
    if (user.status === "deactive")
      throw createError.Unauthorized("Your account is suspended.");
    if (user.status === "delete")
      throw createError.Unauthorized("Your account is removed.");

    // ✅ Verify OTP via helper
    const result = await verifyOtp(phone, otp);
    if (!result.success) throw createError.Unauthorized(result.message);

    // Generate tokens
    const accessToken = await genAccessToken(user);
    const refreshToken = await genRefreshToken(user);
    refreshTokenArray.push(refreshToken);

    res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "strict",
      })
      .json({
        success: true,
        message: "Login successful via OTP",
        user,
        refreshToken,
      });
  } catch (error) {
    console.error("Login with phone OTP error:", error);
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refToken } = req.body;

    //if there is no ref token throwing err
    if (!refToken)
      throw createHttpError.InternalServerError("no refresh token found");

    //get the ref token from the array with
    if (!refreshTokenArray.includes(refToken))
      throw createError.InternalServerError("Invalid refresh token");

    //verify the ref token from array
    const decoded = jwt.verify(refToken, process.env.JWT_REFRESH_TOKEN_SECRET);

    const userId = decoded._id;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw createError.InternalServerError("user not found");
    }
    //black listing the used refresh token
    refreshTokenArray = refreshTokenArray.filter((item) => item != refToken);

    //if it matches create a new pair of auth token and refresh token
    const accessToken = await genAccessToken(user);
    const refreshToken = await genRefreshToken(user);

    //saving the new refresh token to array
    refreshTokenArray.push(refreshToken);

    //sending response to the client
    res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "strict",
      })
      .json({
        success: true,
        user: true,
        message: "new pair of tokens created",
        refreshToken,
      });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

const logout = (req, res, next) => {
  try {
    //get the ref token from body
    // const { refToken, fcmToken, deviceInfo } = req.body;
    const { refToken } = req.body;
    //if there is no ref token throwing err
    if (!refToken)
      throw createHttpError.InternalServerError("no refresh token found");

    //if it matches
    jwt.verify(
      refToken,
      process.env.JWT_REFRESH_TOKEN_SECRET,
      async (err, data) => {
        if (err) throw createError.Unauthorized(err);

        //black listing the used refresh token
        refreshTokenArray = refreshTokenArray.filter(
          (item) => item != refToken
        );
        // redisClient.set(`blacklist:${decoded.sub}`, 'revoked');

        // await removeFCMToken(data._id, fcmToken, deviceInfo)

        res
          .clearCookie("accessToken")
          .json({ success: true, data, message: "Logged out successfully" });
      }
    );
  } catch (error) {
    console.log(error);

    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (user) {
      // block or unblock checking
      if (user.status === "delete")
        throw createError.Unauthorized("Your Account Is Removed");
      if (user.status === "deactive")
        throw createError.Unauthorized("Your Account Is Suspended");

      const name = user.name;
      const otp = await buildOTP(email);
      const mailResponse = await sendOtpEmail(
        email,
        otp,
        (type = "reset"),
        name
      );

      if (!mailResponse.success) {
        return res
          .status(500)
          .json({ success: false, message: "Failed to send OTP via email" });
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully to your registered email",
      });
    } else {
      res.status(200).json({ success: false, message: "user Not Found" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOtp(email, otp);
    if (!result.success) throw createError.Unauthorized(result.message);
    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ error, message: "Server error" });
  }
};
const updateNewPassword = async (req, res, next) => {
  try {
    const { email, pass } = req.body;

    if (!email || !pass) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);

    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    next(createError.InternalServerError(error.message));
  }
};

const googleAuth = async (req, res, next) => {
  
  try {
    const token = req.body.credential;
    const decodedToken = jwtDecode(token);

    // Check if the token contains the required information
    if (
      !decodedToken.email ||
      !decodedToken.email_verified ||
      !decodedToken.name ||
      !decodedToken.given_name ||
      !decodedToken.family_name
    ) {
      return next(createError.BadRequest("Invalid token data"));
    }

    // Check if the email is verified
    if (!decodedToken.email_verified) {
      return next(createError.BadRequest("Email not verified"));
    }
    console.log("Decoded Token:", decodedToken);

    // Check if the user already exists
    const user = await User.findOne({ email: decodedToken.email });
    console.log(user);

    if (user) {
      /* ------------------------ block or unblock checking ----------------------- */
      if (user.status === "deactive")
        throw createError.Unauthorized("Your account is suspended.");
      /* ------------------------ delete or noy checking ----------------------- */
      if (user.status === "delete")
        throw createError.Unauthorized("Your account is removed.");

      /* ---------------- generating acess-token and refresh-token ---------------- */
      const accessToken = await genAccessToken(user);
      const refreshToken = await genRefreshToken(user);

      /* ------------------ set the refresh-token in to an array ------------------ */
      refreshTokenArray.push(refreshToken);

      /* ------------------- set the access-token to the cookies ------------------ */

      res
        .status(200)
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: "strict",
        })
        .json({ success: true, user, refreshToken });
    } else {
      res.status(404).json({
        success: false,
        message: "User not found, Contact Admin",
      });
    }
  } catch (error) {
    console.error("Error during Google authentication:", error);
    return next(
      createError.InternalServerError("Error during Google authentication")
    );
  }
};

module.exports = {
  login,
  sendLoginOtp,
  refreshToken,
  logout,
  forgotPassword,
  verifyEmailOTP,
  updateNewPassword,
  googleAuth,
  verifyLoginOtp,
  signup,
  signupEmail,
  verifyEmail,
  signupPhone,
  verifyPhone,
};
