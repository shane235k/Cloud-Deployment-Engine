const mongoose = require("mongoose");

const InfrastructureSchema = new mongoose.Schema(
  {
    environmentName: {
      type: String,
      default: "kubedeploy",
    },
    status: {
      type: String,
      enum: ["NOT_CREATED", "PROVISIONING", "ACTIVE", "FAILED", "DESTROYING"],
      default: "NOT_CREATED",
    },
    vpcId: {
      type: String,
      default: "",
    },
    publicSubnetIds: {
      type: [String],
      default: [],
    },
    privateSubnetId: {
      type: String,
      default: "",
    },
    albDns: {
      type: String,
      default: "",
    },
    albArn: {
      type: String,
      default: "",
    },
    k3sServerPrivateIp: {
      type: String,
      default: "",
    },
    controlPlaneInstanceId: {
      type: String,
      default: "",
    },
    controlPlaneWorkspace: {
      type: String,
      default: "",
    },
    lastProvisionedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Infrastructure", InfrastructureSchema);
