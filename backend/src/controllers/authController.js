const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const jwtConfig = require("../config/jwt");

const buildAuthPayload = (user) => {
  const normalizedRole = String(user.role || "").toLowerCase();

  return {
    id: user.user_id,
    email: user.email,
    role: normalizedRole,
    name: user.name,
    needs_password_change: Boolean(user.needs_password_change)
  };
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, active: true } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const authUser = buildAuthPayload(user);
    const token = jwt.sign(
      authUser,
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json({
      token,
      user: authUser
    });
  } catch (err) {
    next(err);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { user_id: req.user.id, active: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: buildAuthPayload(user) });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findOne({
      where: { user_id: req.user.id, active: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.needs_password_change = false;
    await user.save();

    const authUser = buildAuthPayload(user);
    const token = jwt.sign(authUser, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn
    });

    res.json({
      message: "Password changed successfully",
      token,
      user: authUser
    });
  } catch (err) {
    next(err);
  }
};

exports.createInitialAdmin = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required" });
    }

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ where: { role: "admin" } });
    if (existingAdmin) {
      return res.status(409).json({ message: "An admin user already exists" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name,
      email,
      password: hash,
      role: "admin",
      active: true
    });

    res.status(201).json({ 
      message: "Admin user created successfully",
      user: {
        id: admin.user_id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    next(err);
  }
};
