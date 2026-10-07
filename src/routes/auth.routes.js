const express = require("express");
const { register, sendRegistrationOtp, userLoginController } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/register", register);
router.post("/login", userLoginController);
router.post("/logout", (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logout successful' });
});

module.exports = router;