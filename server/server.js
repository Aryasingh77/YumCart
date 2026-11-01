// server.js
// Entry point for the Yum Cart Express API + static frontend server.

const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const menuRoutes = require("./routes/menuRoutes");
const cartRoutes = require("./routes/cartRoutes");

const ensureAdmin = require("./config/ensureAdmin");

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- API Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/cart", cartRoutes);

// Simple health check, handy for confirming the server + DB are up.
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Yum Cart API is running" });
});

// ---------- Serve the frontend ----------
// The HTML/CSS/JS frontend lives in ../public. Since the API and frontend
// share the same Express server, the frontend can call fetch('/api/...')
// without hardcoding a host/port.
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

app.get("/login", (req, res) => res.sendFile(path.join(publicDir, "login.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(publicDir, "admin.html")));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "yumcart-food-delivery.html"));
});

// ---------- 404 handler for unknown API routes ----------
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ---------- Central error handler (catches anything thrown/passed to next()) ----------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening for requests.
connectDB().then(() => {
  ensureAdmin().then(() => app.listen(PORT, () => {
    console.log(`Yum Cart server running at http://localhost:${PORT}`);
  }));
});
