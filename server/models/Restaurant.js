// models/Restaurant.js
// Represents a restaurant shown on the Yum Cart homepage.

const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    cuisine: {
      type: String,
      required: [true, "Cuisine is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
    },
    time: {
      type: String, // e.g. "25-30 min"
      required: [true, "Delivery time estimate is required"],
      trim: true,
    },
    img: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
