const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = new User({
      name,
      email,
      password,
    });

    await user.save();
    res.status(201).json({ success: true, data: user });

    // sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, data: {} });
};

exports.googleCallback = (req, res) => {
  // Create token
  const token = jwt.sign({ email: req.user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "90d",
  });
  
  const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("token", token, cookieOptions);

  res.cookie("auth_token", token, {
    ...cookieOptions,
    httpOnly: false,
  });

  const userData = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
  };

  res.cookie("auth_user", JSON.stringify(userData), {
    ...cookieOptions,
    httpOnly: false,
  });

  res.redirect(frontendURL);
};

exports.facebookCallback = (req, res) => {
  const token = jwt.sign({ email: req.user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "90d",
  });
  
  const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("token", token, cookieOptions);

  res.cookie("auth_token", token, {
    ...cookieOptions,
    httpOnly: false,
  });

  const userData = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
  };

  res.cookie("auth_user", JSON.stringify(userData), {
    ...cookieOptions,
    httpOnly: false,
  });

  res.redirect(frontendURL);
};
const sendTokenResponse = (user, statusCode, res) => {
  const payload = { email: user.email };
  const jwtSecret = process.env.JWT_SECRET || "your_default_secret";

  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "90d",
  });

  const options = {
    httpOnly: true,
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    sameSite: "lax",
    path: "/",
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true });
};

