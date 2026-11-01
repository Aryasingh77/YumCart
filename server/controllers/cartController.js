// controllers/cartController.js
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const MenuItem = require("../models/MenuItem");

const DELIVERY_FEE = 40;
const FREE_DELIVERY_THRESHOLD = 500;

// Recalculates subtotal/deliveryFee/total by looking up the *current* price
// of every menu item from MongoDB. We never trust prices sent by the client.
async function recalculateCart(cart) {
  let subtotal = 0;

  for (const item of cart.items) {
    // item.menuItem may already be populated (an object) or just an ObjectId
    const menuItemId = item.menuItem._id || item.menuItem;
    const menuItem = await MenuItem.findById(menuItemId);

    // If a menu item was deleted from the catalog after being added to a cart,
    // skip it in the total (it will still be dropped from items below).
    if (menuItem) {
      subtotal += menuItem.price * item.qty;
    }
  }

  const deliveryFee = subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  cart.subtotal = subtotal;
  cart.deliveryFee = deliveryFee;
  cart.total = total;

  return cart;
}

// Removes cart items that reference a menu item that no longer exists,
// so the cart never crashes on a stale reference.
async function pruneDeletedItems(cart) {
  const validItems = [];
  for (const item of cart.items) {
    const menuItemId = item.menuItem._id || item.menuItem;
    const exists = await MenuItem.exists({ _id: menuItemId });
    if (exists) validItems.push(item);
  }
  cart.items = validItems;
  return cart;
}

async function findOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [], subtotal: 0, deliveryFee: 0, total: 0 });
  }
  return cart;
}

async function getPopulatedCart(userId) {
  const cart = await Cart.findOne({ userId }).populate({
    path: "items.menuItem",
    populate: { path: "restaurant", select: "name cuisine rating time img" },
  });
  return cart;
}

// GET /api/cart/:userId
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    let cart = await getPopulatedCart(userId);

    if (!cart) {
      // No cart yet for this user — return an empty cart shape rather than a 404,
      // since "no cart" is a perfectly normal state for a new visitor.
      return res.status(200).json({
        success: true,
        data: { userId, items: [], subtotal: 0, deliveryFee: 0, total: 0 },
      });
    }

    await pruneDeletedItems(cart);
    await recalculateCart(cart);
    await cart.save();

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch cart", error: error.message });
  }
};

// POST /api/cart
// Body: { userId } — creates an empty cart if one doesn't already exist.
exports.createCart = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }

    let cart = await Cart.findOne({ userId });
    if (cart) {
      return res.status(200).json({ success: true, message: "Cart already exists", data: cart });
    }

    cart = await Cart.create({ userId, items: [], subtotal: 0, deliveryFee: 0, total: 0 });
    res.status(201).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create cart", error: error.message });
  }
};

// PUT /api/cart/:userId
// Body: { items: [{ menuItemId, qty }] } — replaces the entire item list at once.
exports.updateCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "items must be an array" });
    }

    for (const it of items) {
      if (!it.menuItemId || !mongoose.Types.ObjectId.isValid(it.menuItemId)) {
        return res.status(400).json({ success: false, message: "Each item needs a valid menuItemId" });
      }
      if (!Number.isInteger(it.qty) || it.qty < 1) {
        return res.status(400).json({ success: false, message: "Each item needs a qty of at least 1" });
      }
    }

    const cart = await findOrCreateCart(userId);
    cart.items = items.map((it) => ({ menuItem: it.menuItemId, qty: it.qty }));

    await pruneDeletedItems(cart);
    await recalculateCart(cart);
    await cart.save();

    const populated = await getPopulatedCart(userId);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update cart", error: error.message });
  }
};

// DELETE /api/cart/:userId  (clears the whole cart)
exports.deleteCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    cart.items = [];
    cart.subtotal = 0;
    cart.deliveryFee = 0;
    cart.total = 0;
    await cart.save();

    res.status(200).json({ success: true, message: "Cart cleared", data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete cart", error: error.message });
  }
};

// POST /api/cart/:userId/items
// Body: { menuItemId, qty }
exports.addItem = async (req, res) => {
  try {
    const { userId } = req.params;
    const { menuItemId, qty } = req.body;

    if (!menuItemId || !mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ success: false, message: "A valid menuItemId is required" });
    }

    const quantity = qty === undefined ? 1 : Number(qty);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: "qty must be a positive integer" });
    }

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    const cart = await findOrCreateCart(userId);

    const existing = cart.items.find((it) => it.menuItem.toString() === menuItemId);
    if (existing) {
      existing.qty += quantity;
    } else {
      cart.items.push({ menuItem: menuItemId, qty: quantity });
    }

    await recalculateCart(cart);
    await cart.save();

    const populated = await getPopulatedCart(userId);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add item to cart", error: error.message });
  }
};

// PUT /api/cart/:userId/items/:menuItemId
// Body: { qty }
exports.updateItemQty = async (req, res) => {
  try {
    const { userId, menuItemId } = req.params;
    const { qty } = req.body;

    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ success: false, message: "Invalid menuItemId" });
    }

    if (!Number.isInteger(qty) || qty < 0) {
      return res.status(400).json({ success: false, message: "qty must be a non-negative integer" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find((it) => it.menuItem.toString() === menuItemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    if (qty === 0) {
      // Quantity of 0 means remove the item, matching the frontend's −/+ behavior.
      cart.items = cart.items.filter((it) => it.menuItem.toString() !== menuItemId);
    } else {
      item.qty = qty;
    }

    await recalculateCart(cart);
    await cart.save();

    const populated = await getPopulatedCart(userId);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update item quantity", error: error.message });
  }
};

// DELETE /api/cart/:userId/items/:menuItemId
exports.removeItem = async (req, res) => {
  try {
    const { userId, menuItemId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
      return res.status(400).json({ success: false, message: "Invalid menuItemId" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const beforeCount = cart.items.length;
    cart.items = cart.items.filter((it) => it.menuItem.toString() !== menuItemId);

    if (cart.items.length === beforeCount) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    await recalculateCart(cart);
    await cart.save();

    const populated = await getPopulatedCart(userId);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove item from cart", error: error.message });
  }
};

// POST /api/cart/:userId/checkout
exports.checkout = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty, nothing to checkout" });
    }

    // No real payment gateway — we just record the order was "placed" and clear the cart.
    const orderSummary = {
      userId: cart.userId,
      itemCount: cart.items.reduce((sum, it) => sum + it.qty, 0),
      subtotal: cart.subtotal,
      deliveryFee: cart.deliveryFee,
      total: cart.total,
    };

    cart.items = [];
    cart.subtotal = 0;
    cart.deliveryFee = 0;
    cart.total = 0;
    await cart.save();

    res.status(200).json({ success: true, message: "Order placed", order: orderSummary, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Checkout failed", error: error.message });
  }
};
