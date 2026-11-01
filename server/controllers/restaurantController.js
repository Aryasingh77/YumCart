// controllers/restaurantController.js
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");

// GET /api/restaurants
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch restaurants", error: error.message });
  }
};

// GET /api/restaurants/:id
exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant id" });
    }

    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch restaurant", error: error.message });
  }
};

// POST /api/restaurants
exports.createRestaurant = async (req, res) => {
  try {
    const { name, cuisine, rating, time, img } = req.body;

    if (!name || !cuisine || rating === undefined || !time || !img) {
      return res.status(400).json({
        success: false,
        message: "name, cuisine, rating, time and img are all required",
      });
    }

    const restaurant = await Restaurant.create({ name, cuisine, rating, time, img });
    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Failed to create restaurant", error: error.message });
  }
};

// PUT /api/restaurants/:id
exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant id" });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Failed to update restaurant", error: error.message });
  }
};

// DELETE /api/restaurants/:id
exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant id" });
    }

    const restaurant = await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    res.status(200).json({ success: true, message: "Restaurant deleted", data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete restaurant", error: error.message });
  }
};
