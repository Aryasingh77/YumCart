// server.js
// Entry point for the Yum Cart Express API + static frontend server.


// server.js
// YumCart - Express API + Vercel Serverless Handler

const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, ".env")
});

const connectDB = require("./config/db");
const ensureAdmin = require("./config/ensureAdmin");

const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const menuRoutes = require("./routes/menuRoutes");
const cartRoutes = require("./routes/cartRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize MongoDB and admin only once per running instance
let initializationPromise;

async function initializeDatabase() {
    if (!initializationPromise) {
        initializationPromise = (async () => {
            await connectDB();
            await ensureAdmin();
            console.log("YumCart database initialized");
        })().catch((error) => {
            initializationPromise = null;
            throw error;
        });
    }

    return initializationPromise;
}

// Ensure database is ready before API requests
app.use("/api", async (req, res, next) => {
    try {
        await initializeDatabase();
        next();
    } catch (error) {
        console.error("Database initialization failed:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/cart", cartRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "YumCart API is running",
        database: "Connected"
    });
});

// Frontend
const publicDir = path.join(__dirname, "..", "public");

app.use(express.static(publicDir));

app.get("/login", (req, res) => {
    res.sendFile(path.join(publicDir, "login.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(publicDir, "admin.html"));
});

app.get("/", (req, res) => {
    res.sendFile(
        path.join(publicDir, "yumcart-food-delivery.html")
    );
});

// API 404
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

// Local development only
if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`YumCart running at http://localhost:${PORT}`);
    });
}

// IMPORTANT: Vercel needs this export
module.exports = app;

