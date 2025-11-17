const {
  login,
  forgotPassword,
  updateNewPassword,
  refreshToken,
  logout,
  googleAuth,
  sendLoginOtp,
  verifyLoginOtp,
  signup,
  signupPhone,
  signupEmail,
  verifyEmailOTP,
  verifyEmail,
  verifyPhone,
} = require("../controllers/authController");

const router = require("express").Router();

router.post("/signup", signup);
router.post("/signup/email-otp/:id", signupEmail);
router.post("/signup/email-verify", verifyEmail);
router.post("/signup/sms-otp/:id", signupPhone);
router.post("/signup/phone-verify", verifyPhone);

router.post("/login", login);
router.post("/login/send-otp", sendLoginOtp);
router.post("/login/verify-otp", verifyLoginOtp);
router.post('/login/googleAuth',googleAuth);

router.post("/forgotPassword", forgotPassword);
router.post("/verify-otp", verifyEmailOTP);
router.put("/resetPassword", updateNewPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

module.exports = router;
