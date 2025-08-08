// controllers/auth.controller.js
import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ✅ Register a new user
export async function registerUser(req, res) {
  const { username, email, password, role } = req.body;

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$/;
  if (!passwordPattern.test(password)) {
    return res.status(400).json({ error: "Password must be 8–25 chars, include uppercase, lowercase, number, and symbol." });
  }

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0)
      return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const finalRole = ["admin", "cashier", "user"].includes(role) ? role : "user";

    const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, role, created_at`,
      [username, email, hashed, finalRole]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: "Database error" });
  }
}

// ✅ Login a user and return JWT + set refreshToken cookie
export async function loginUser(req, res) {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

// ✅ Refresh access token from httpOnly cookie
export function refreshAccessToken(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token: accessToken });
  } catch (err) {
    console.error("❌ Refresh token error:", err);
    return res.status(403).json({ error: "Invalid or expired refresh token." });
  }
}

// ✅ Get current user from token
export async function getProfile(req, res) {
  res.json({
    userId: req.user.userId,
    username: req.user.username,
    role: req.user.role,
  });
}

// ✅ Update user profile
export async function updateProfile(req, res) {
  const { username, email, avatar_url } = req.body;

  try {
    const result = await pool.query(
      "UPDATE users SET username = $1, email = $2, avatar_url = $3 WHERE id = $4 RETURNING id, username, email, avatar_url",
      [username, email, avatar_url, req.user.userId]
    );

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

// ✅ Admin-only route welcome
export function adminWelcome(req, res) {
  res.json({
    message: "Welcome, admin!",
    user: req.user,
  });
}

// ✅ Get all users (admin only)
export async function getAllUsers(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role, created_at FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

// ✅ Change password for authenticated user
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ error: "Incorrect current password" });

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [hashed, userId]
    );

    res.json({ message: "Password changed successfully." });
  } catch (err) {
    console.error("❌ Change password failed:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
}
