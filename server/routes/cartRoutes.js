// routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const {
  getCart,
  createCart,
  updateCart,
  deleteCart,
  addItem,
  updateItemQty,
  removeItem,
  checkout,
} = require("../controllers/cartController");
const { protect, ownCartOnly } = require("../middleware/auth");

// Every cart route needs a logged-in user, and only for their own cart.
router.use(protect);

router.route("/").post(ownCartOnly, createCart);

router.use("/:userId", ownCartOnly);
router.route("/:userId").get(getCart).put(updateCart).delete(deleteCart);

router.route("/:userId/items").post(addItem);
router.route("/:userId/items/:menuItemId").put(updateItemQty).delete(removeItem);

router.route("/:userId/checkout").post(checkout);

module.exports = router;
