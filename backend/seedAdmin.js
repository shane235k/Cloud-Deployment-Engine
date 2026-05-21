require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const existingUser = await User.findOne({ username: "shane" });

    if (existingUser) {
      console.log("Admin user already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("X2rj3xs5*", 10);

    await User.create({
      username: "shane",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin user created successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  }
}

seedAdmin();