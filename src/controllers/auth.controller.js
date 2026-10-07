const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const { serverError } = require("../services/http.service");

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function sanitizeUser(user) {
  const userResponse = user.toObject ? user.toObject() : { ...user };
  delete userResponse.password;
  return userResponse;
}

async function register(req, res) {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const role = req.body.role || 'buyer';

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please provide name, email and password" });
  }
  if (!['buyer', 'seller'].includes(role)) {
    return res.status(400).json({ message: "Choose buyer or seller for your account" });
  }

  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
    return res.status(500).json({ message: "JWT configuration is missing" });
  }

  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await userModel.create({ name, email, password, role });

    try {
      await emailService.sendRegistrationEmail(newUser.email, newUser.name);
    } catch (emailError) {
      console.error("Registration email failed:", emailError.message);
    }

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    const userResponse = sanitizeUser(newUser);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
      token
    });
  } catch (error) {
    return serverError(res, error.code === 11000 ? "User already exists" : "Server error", error, error.code === 11000 ? 409 : 500);
  }
}

async function userLoginController(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ message: "Please provide email and password" });
  }

  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
    return res.status(500).json({ message: "JWT configuration is missing" });
  }

  try {
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    const userResponse = sanitizeUser(user);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production"
    });

    res.json({ message: "Login successful", user: userResponse, token });
  } catch (error) {
    return serverError(res, "Server error", error);
  }
}

module.exports = {
  register,
  userLoginController
};
