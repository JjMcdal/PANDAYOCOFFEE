import jwt from "jsonwebtoken";

// ✅ Middleware: Verifies JWT token
export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("📦 Token received:", token); // DEBUG
  console.log("🔐 JWT_SECRET being used:", process.env.JWT_SECRET); // DEBUG

  if (!token) return res.status(401).json({ error: "Token missing" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("❌ Token verification error:", err.message); // DEBUG
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  });
}

// ✅ Middleware: Checks if user has admin role
export function verifyAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
}
