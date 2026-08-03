const mongoose = require("mongoose");

const ServerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    instanceId: {
      type: String,
      required: true,
      unique: true,
    },
    workspace: {
      type: String,
      required: true,
      unique: true,
    },
    terraformManaged: {
      type: Boolean,
      default: true,
    },
    publicIp: {
      type: String,
      required: true,
    },
    privateIp: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["HEALTHY", "BUSY", "OFFLINE"],
      default: "HEALTHY",
    },
    cpuUsage: {
      type: Number,
      default: 0,
    },
    ramUsage: {
      type: Number,
      default: 0,
    },
    diskUsage: {
      type: Number,
      default: 0,
    },
    uptime: {
      type: String,
      default: "",
    },
    podCount: {
      type: Number,
      default: 0,
    },
    activeDeployments: {
      type: Number,
      default: 0,
    },
    maxDeployments: {
      type: Number,
      default: 10,
    },
    sshUser: {
      type: String,
      default: "ubuntu",
    },
    clusterType: {
      type: String,
      default: "k3s",
    },
    consecutiveFailures: {
      type: Number,
      default: 0,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },
    lastPollAttempt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Server", ServerSchema);
