// ✅ Import core modules
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ✅ Import routes
import authRoutes from "./routes/auth.route.js";

// ✅ Init
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Routes
app.use("/api", authRoutes);

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🚀 PandayoCoffee Backend is live");
});

// ✅ Server start
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
