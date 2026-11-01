// controllers/menuController.js
const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");

// GET /api/menu
// Supports: ?type=veg|nonveg  ?cuisine=Indian  ?maxPrice=300  ?search=chicken  ?restaurant=<id>
exports.getMenuItems = async (req, res) => {
  try {
    const { type, cuisine, maxPrice, search, restaurant } = req.query;
    const filter = {};

    if (type) {
      if (!["veg", "nonveg"].includes(type)) {
        return res.status(400).json({ success: false, message: "type must be 'veg' or 'nonveg'" });
      }
      filter.type = type;
    }

    if (cuisine && cuisine !== "all") {
      // Case-insensitive exact match on cuisine name
      filter.cuisine = new RegExp(`^${cuisine}$`, "i");
    }

    if (maxPrice !== undefined) {
      const max = Number(maxPrice);
      if (Number.isNaN(max) || max < 0) {
        return res.status(400).json({ success: false, message: "maxPrice must be a positive number" });
      }
      filter.price = { $lte: max };
    }

    if (restaurant) {
      if (!mongoose.Types.ObjectId.isValid(restaurant)) {
        return res.status(400).json({ success: false, message: "Invalid restaurant id" });
      }
      filter.restaurant = restaurant;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex chars
      const searchRegex = new RegExp(safeSearch, "i");
      filter.$or = [{ name: searchRegex }, { cuisine: searchRegex }];
    }

    const menuItems = await MenuItem.find(filter)
      .populate("restaurant", "name cuisine rating time img")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: menuItems.length, data: menuItems });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch menu items", error: error.message });
  }
};

// GET /api/menu/:id
exports.getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid menu item id" });
    }

    const menuItem = await MenuItem.findById(id).populate("restaurant", "name cuisine rating time img");

    if (!menuItem) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    res.status(200).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch menu item", error: error.message });
  }
};

// POST /api/menu
exports.createMenuItem = async (req, res) => {
  try {
    const { name, cuisine, type, price, img, desc, restaurant } = req.body;

    if (!name || !cuisine || !type || price === undefined || !img || !desc || !restaurant) {
      return res.status(400).json({
        success: false,
        message: "name, cuisine, type, price, img, desc and restaurant are all required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(restaurant)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant id" });
    }

    const menuItem = await MenuItem.create({ name, cuisine, type, price, img, desc, restaurant });
    const populated = await menuItem.populate("restaurant", "name cuisine rating time img");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Failed to create menu item", error: error.message });
  }
};

// PUT /api/menu/:id
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid menu item id" });
    }

    if (req.body.restaurant && !mongoose.Types.ObjectId.isValid(req.body.restaurant)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant id" });
    }

    const menuItem = await MenuItem.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate("restaurant", "name cuisine rating time img");

    if (!menuItem) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    res.status(200).json({ success: true, data: menuItem });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Failed to update menu item", error: error.message });
  }
};

// DELETE /api/menu/:id
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid menu item id" });
    }

    const menuItem = await MenuItem.findByIdAndDelete(id);

    if (!menuItem) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    res.status(200).json({ success: true, message: "Menu item deleted", data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete menu item", error: error.message });
  }
};
