// ✅ Import all required modules
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pg from "pg";
import { verifyToken, verifyAdmin } from "./authMiddleware.js"; // ✅ Now includes verifyAdmin

// ✅ Load environment variables from .env
dotenv.config();

// ✅ Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ✅ PostgreSQL connection setup
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ Register route - now supports custom roles like "cashier"
app.post("/api/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const finalRole = role && ["admin", "cashier", "user"].includes(role)
      ? role
      : "user"; // ✅ default fallback

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, role, created_at`,
      [username, email, hashed, finalRole]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Login route - verifies credentials and returns JWT
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role, // ✅ include role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Protected route - returns user info if token is valid
app.get("/api/me", verifyToken, (req, res) => {
  res.json({
    userId: req.user.userId,
    username: req.user.username,
    role: req.user.role,
  });
});

// ✅ Update Profile route - protected
app.put("/api/update-profile", verifyToken, async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ✅ Admin-only welcome route
app.get("/api/admin-only", verifyToken, verifyAdmin, (req, res) => {
  res.json({
    message: "Welcome, admin!",
    user: req.user,
  });
});

// ✅ Admin-only route to view all users
app.get("/api/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, username, email, role, created_at FROM users ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
