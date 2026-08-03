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
      enum: ['QUEUED', 'BUILDING', 'RUNNING', 'FAILED', 'STOPPED', 'CANCELLED', 'ROLLING_BACK'],
      default: 'QUEUED',
    },

    // Runtime details
    url: String,
    imageName: String,
    deploymentName: String,
    serviceName: String,

    // Jenkins Build Metadata
    jenkinsBuildNumber: Number,
    jenkinsBuildUrl: String,
    jenkinsResult: String,
    pipelineStartedAt: Date,
    pipelineFinishedAt: Date,

    // Cancellation & Rollback Metadata
    cancelledAt: Date,
    rolledBackFrom: String,
    rollbackReason: String,

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