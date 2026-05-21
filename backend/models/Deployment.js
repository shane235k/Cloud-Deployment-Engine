const mongoose = require('mongoose');

const DeploymentSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    // Source information
    repoUrl: {
      type: String,
      required: true,
    },

    // User-provided metadata
    projectName: {
      type: String,
      default: 'Untitled Project',
    },

    projectType: {
      type: String,
      enum: ['frontend', 'backend', 'fullstack'],
      default: 'frontend',
    },
    podName: {
      type: String,
      default: 'not yet created',
    },
    framework: {
      type: String,
      default: 'react',
    },

    buildCommand: {
      type: String,
      default: 'npm run build',
    },

    outputDirectory: {
      type: String,
      default: 'dist',
    },

    // Deployment status
    status: {
      type: String,
      enum: ['BUILDING', 'RUNNING', 'FAILED', 'STOPPED'],
      default: 'BUILDING',
    },

    // Runtime details
    url: String,
    imageName: String,
    deploymentName: String,
    serviceName: String,

    // Deployment logs
    logs: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Deployment', DeploymentSchema);