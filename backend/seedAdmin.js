require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27018/kubedeploy";

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB for admin seeding...");
    await mongoose.connect(MONGODB_URI);

    const adminUsername = "admin";
    const adminPasswordRaw = "Admin123!";
    const hashedPassword = await bcrypt.hash(adminPasswordRaw, 10);

    // Upsert admin user
    const adminUser = await User.findOneAndUpdate(
      { username: adminUsername },
      {
        username: adminUsername,
        password: hashedPassword,
        role: "admin",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("==========================================");
    console.log("Admin account seeded successfully!");
    console.log(`Username: ${adminUser.username}`);
    console.log(`Password: ${adminPasswordRaw}`);
    console.log(`Role: ${adminUser.role}`);
    console.log("==========================================");

    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin user:", error);
    process.exit(1);
  }
}

seedAdmin();