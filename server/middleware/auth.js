// middleware/auth.js
// JWT helpers + route guards.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = () => process.env.JWT_SECRET || "dev-only-change-me";

exports.signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Requires a valid "Authorization: Bearer <token>" header. Sets req.user.
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "Please log in to continue" });

    const decoded = jwt.verify(token, JWT_SECRET());
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "Account no longer exists" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Session expired, please log in again" });
  }
};

// Use after protect(): only lets admins through.
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  res.status(403).json({ success: false, message: "Admin access required" });
};

// Cart routes: a logged-in user can only touch their own cart.
exports.ownCartOnly = (req, res, next) => {
  const target = req.params.userId || req.body.userId;
  if (target && target !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "You can only access your own cart" });
  }
  next();
};
