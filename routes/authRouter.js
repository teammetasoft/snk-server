const {
  login,
  forgotPassword,
  updateNewPassword,
  refreshToken,
  logout,
  googleAuth,
  sendLoginOtp,
  verifyLoginOtp,
  verifyEmailPhone,
  signup,
  signupPhone,
  signupEmail,
} = require("../controllers/authController");

const router = require("express").Router();

router.post("/signup/email-otp", signupEmail);
router.post("/signup/sms-otp", signupPhone);
router.post("/signup", signup);
router.post("/login", login);
router.post("/login/send-otp", sendLoginOtp);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/forgotPassword", forgotPassword);
router.post("/verify-otp", verifyEmailPhone);
router.put("/resetPassword", updateNewPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

module.exports = router;
