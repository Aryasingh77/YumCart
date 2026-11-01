
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // Reuse an existing connection
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error("MONGO_URI environment variable is missing");
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000
        });

        console.log(
            `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
        );

        return conn.connection;

    } catch (error) {
        console.error("MongoDB connection error:", error.message);

        // Let the Express handler handle the error
        throw error;
    }
};

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
    console.error("MongoDB runtime error:", error.message);
});

module.exports = connectDB;
