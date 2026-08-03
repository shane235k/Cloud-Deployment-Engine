const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "p377_secret_jwt_key_2026";

/**
 * Middleware to verify JWT token.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized: Missing token",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

/**
 * Middleware to enforce role === 'admin'.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden: Admin privileges required",
    });
  }
  next();
}

module.exports = {
  authenticate,
  requireAdmin,
};
