// models/MenuItem.js
// Represents a single food/menu item, linked to a Restaurant.

const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    cuisine: {
      type: String,
      required: [true, "Cuisine is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: {
        values: ["veg", "nonveg"],
        message: "Type must be either 'veg' or 'nonveg'",
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    img: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    desc: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: [true, "Menu item must belong to a restaurant"],
    },
  },
  { timestamps: true }
);

// Helpful indexes for filtering/searching.
menuItemSchema.index({ name: "text", cuisine: "text" });
menuItemSchema.index({ type: 1 });
menuItemSchema.index({ cuisine: 1 });
menuItemSchema.index({ price: 1 });

module.exports = mongoose.model("MenuItem", menuItemSchema);
