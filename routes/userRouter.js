const express = require("express");
const router = express.Router();
const { verifyJwt } = require("../middleware/auth");
const { getProfile, updateProfile } = require("../controllers/userController");
router.use(verifyJwt);

router.get("/profile", getProfile);
router.patch("/update", updateProfile);

module.exports = router;
