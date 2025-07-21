import express from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", verifyToken, (req, res) => {
  res.json(req.user);
});
router.get("/admin-only", verifyToken, verifyAdmin, (req, res) => {
  res.json({ message: "Welcome, admin!", user: req.user });
});

export default router;
