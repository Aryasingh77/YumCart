// config/db.js
// Handles the MongoDB connection using Mongoose.

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI is not defined in the .env file");
    }

    const conn = await mongoose.connect(uri);

    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    // If we can't connect to the database, there is no point continuing.
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Log runtime connection issues (e.g. MongoDB restarts) without crashing the app.
mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting will resume on next request.");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB runtime error: ${err.message}`);
});

module.exports = connectDB;
