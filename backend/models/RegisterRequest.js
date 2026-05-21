const mongoose = require("mongoose");

const RegisterRequestSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    message: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "RegisterRequest",
  RegisterRequestSchema
);