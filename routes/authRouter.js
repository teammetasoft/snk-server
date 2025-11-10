const {
  login,
  forgotPassword,
  updateNewPassword,
  refreshToken,
  logout,
  googleAuth,
  verifyEmail,
  sendLoginOtp,
  verifyLoginOtp,
} = require("../controllers/authController");

const router = require("express").Router();

router.post("/login", login);
router.post("/login/send-otp", sendLoginOtp);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/forgotPassword", forgotPassword);
router.post("/verify-email", verifyEmail);
router.put("/resetPassword", updateNewPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

module.exports = router;
