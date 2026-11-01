// routes/menuRoutes.js
const express = require("express");
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/menu supports ?type= ?cuisine= ?maxPrice= ?search= ?restaurant=
router.route("/").get(getMenuItems).post(protect, adminOnly, createMenuItem);
router.route("/:id").get(getMenuItemById).put(protect, adminOnly, updateMenuItem).delete(protect, adminOnly, deleteMenuItem);

module.exports = router;
