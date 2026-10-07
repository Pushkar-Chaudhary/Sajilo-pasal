const express = require("express");
const { register } = require("../controllers/auth.controller");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", authController.userLoginController);
router.post("/logout", (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logout successful' });
});

module.exports = router;