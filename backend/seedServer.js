require("dotenv").config();
const mongoose = require("mongoose");
const Server = require("./models/Server");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27018/kubedeploy";
const DEFAULT_SERVER_IP = process.env.DEFAULT_SERVER_IP;

async function seedServer() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully.");

    if (!DEFAULT_SERVER_IP) {
      console.warn("WARNING: DEFAULT_SERVER_IP environment variable is missing. Skipping server seeding.");
      await mongoose.disconnect();
      process.exit(0);
    }

    const existingCount = await Server.countDocuments();
    if (existingCount > 0) {
      console.log(`Server document(s) already exist (${existingCount} found). Skipping creation.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const defaultServer = await Server.create({
      name: "default-server",
      publicIp: DEFAULT_SERVER_IP,
      status: "HEALTHY",
    });

    console.log("Default server seeded successfully:", defaultServer);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding default server:", error);
    process.exit(1);
  }
}

seedServer();
