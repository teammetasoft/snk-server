const { login, forgotPassword, updateNewPassword, refreshToken, logout, googleAuth, verifyOtp } = require('../controllers/authController');

const router = require('express').Router()

router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.put("/resetPassword", updateNewPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);


module.exports = router