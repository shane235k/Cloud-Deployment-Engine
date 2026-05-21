require("dotenv").config();
const mongoose = require("mongoose");
const Deployment = require("./models/Deployment"); // Assuming you have a Deployment model

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27018/kubedeploy";

async function seed() {
  try {
    console.log("Connecting to MongoDB:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    // Update RUNNING -> STOPPED
    const updateRunning = await Deployment.updateMany(
      { status: "RUNNING" },
      { $set: { status: "STOPPED" } }
    );
    console.log(`Updated ${updateRunning.modifiedCount} RUNNING deployments to STOPPED.`);

    // Update BUILDING -> FAILED
    const updateBuilding = await Deployment.updateMany(
      { status: "BUILDING" },
      { $set: { status: "FAILED" } }
    );
    console.log(`Updated ${updateBuilding.modifiedCount} BUILDING deployments to FAILED.`);

    console.log("Database seed completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error during database seed:", error);
    process.exit(1);
  }
}

seed();
