// config/ensureAdmin.js
// Creates the default admin account on startup if it doesn't exist yet.
// Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD in .env.

const User = require("../models/User");

module.exports = async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@yumcart.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
    }
    return;
  }
  await User.create({ name: "Admin", email, password, role: "admin" });
  console.log(`Default admin created: ${email}  (change the password in .env!)`);
};
