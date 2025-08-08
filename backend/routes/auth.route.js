// routes/auth.route.js
import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getAllUsers,
  adminWelcome,
  changePassword,
  refreshAccessToken // ✅ ADDED
} from "../controllers/auth.controller.js";

import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken); // ✅ ADDED

// Protected routes
router.get("/me", verifyToken, getProfile);
router.put("/update-profile", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);

// Admin-only routes
router.get("/admin-only", verifyToken, verifyAdmin, adminWelcome);
router.get("/users", verifyToken, verifyAdmin, getAllUsers);

export default router;
