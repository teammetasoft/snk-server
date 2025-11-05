//Packages
const bcrypt = require("bcrypt");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");

const User = require("../model/userModel");
const { genAccessToken, genRefreshToken } = require("../helpers/JWT");
const createHttpError = require("http-errors");
const { sendMailResetPass } = require("../helpers/sendMailResetPass");
const { jwtDecode } = require("jwt-decode"); // Note the destructuring
const OTPVerification = require("../model/OTPVerifyModel");

//Functions
let refreshTokenArray = [];

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
    const link = false;

    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (user) {
      // block or unblock checking
      if (user.status === "delete")
        throw createError.Unauthorized("Your Account Is Removed");
      if (user.status === "deactive")
        throw createError.Unauthorized("Your Account Is Suspended");

      const name = user.name;
      await sendMailResetPass(email, res, link, name);
    } else {
      res.status(200).json({ success: false, message: "user Not Found" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await OTPVerification.findOne({ user: email });
    if (!user) return res.status(400).json({ message: "Invalid User" });
    console.log(user.otp,otp);
    
    const validOTP = await bcrypt.compare(otp,user.otp );
    console.log(validOTP);
    
    if (!validOTP) return res.status(400).json({ message: "Invalid OTP" });

    if (user.otpExpires < Date.now())
      return res.status(400).json({ message: "OTP expired" });
    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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

    const otpRecord = await OTPVerification.findOne({ user: email });
    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "OTP not found or expired" });
    }

    if (otpRecord.otp === "used") {
      return res
        .status(400)
        .json({ success: false, message: "OTP already used" });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);

    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    await OTPVerification.updateOne({ user: email }, { $set: { otp: "used" } });

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
  const token = req.body.credential;

  try {
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
  refreshToken,
  logout,
  forgotPassword,
  verifyOtp,
  updateNewPassword,
  googleAuth,
};
