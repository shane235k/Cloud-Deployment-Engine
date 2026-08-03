const Server = require("../models/Server");
const Deployment = require("../models/Deployment");
const RegisterRequest = require("../models/RegisterRequest");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jenkinsService = require("./jenkinsService");
const deploymentQueueService = require("./deploymentQueueService");
const { randomUUID } = require("crypto");

/**
 * Returns platform summary counts for servers and deployments.
 */
async function getSystemSummary() {
  const [
    totalServers,
    healthyServers,
    busyServers,
    offlineServers,
    totalDeployments,
    runningDeployments,
    failedDeployments,
    buildingDeployments,
    stoppedDeployments,
    pendingRequests,
    servers,
    topDeployments,
  ] = await Promise.all([
    Server.countDocuments(),
    Server.countDocuments({ status: "HEALTHY" }),
    Server.countDocuments({ status: "BUSY" }),
    Server.countDocuments({ status: "OFFLINE" }),
    Deployment.countDocuments(),
    Deployment.countDocuments({ status: "RUNNING" }),
    Deployment.countDocuments({ status: "FAILED" }),
    Deployment.countDocuments({ status: "BUILDING" }),
    Deployment.countDocuments({ status: "STOPPED" }),
    RegisterRequest.countDocuments({ status: "PENDING" }),
    Server.find().sort({ name: 1 }),
    Deployment.find().sort({ createdAt: -1 }),
  ]);

  return {
    totalServers,
    healthyServers,
    busyServers,
    offlineServers,
    totalDeployments,
    runningDeployments,
    failedDeployments,
    buildingDeployments,
    stoppedDeployments,
    pendingRequests,
    servers: servers.map((s) => ({
      id: s._id,
      name: s.name,
      instanceId: s.instanceId || s.name,
      workspace: s.workspace || s.name,
      terraformManaged: s.terraformManaged !== undefined ? s.terraformManaged : true,
      publicIp: s.publicIp,
      status: s.status,
      cpuUsage: s.cpuUsage || 0,
      ramUsage: s.ramUsage || 0,
      diskUsage: s.diskUsage || 0,
      podCount: s.podCount || 0,
      activeDeployments: s.activeDeployments || 0,
      maxDeployments: s.maxDeployments || 10,
    })),
    topDeployments: topDeployments.map((d) => ({
      id: d._id,
      projectName: d.projectName,
      framework: d.framework,
      status: d.status,
      podName: d.podName,
      url: d.url,
      createdAt: d.createdAt,
    })),
  };
}

/**
 * Returns every registered server formatted with metrics and health details.
 */
async function getAllRegisteredServers() {
  const servers = await Server.find().sort({ name: 1 });
  return servers.map((s) => ({
    id: s._id,
    name: s.name,
    publicIp: s.publicIp,
    status: s.status,
    cpuUsage: s.cpuUsage || 0,
    ramUsage: s.ramUsage || 0,
    diskUsage: s.diskUsage || 0,
    uptime: s.uptime || "",
    podCount: s.podCount || 0,
    activeDeployments: s.activeDeployments || 0,
    maxDeployments: s.maxDeployments || 10,
    lastHeartbeat: s.lastHeartbeat,
  }));
}

/**
 * Returns the complete document for a single server.
 */
async function getServerDocumentById(id) {
  return await Server.findById(id);
}

/**
 * Triggers the Jenkins Provision Server pipeline via jenkinsService.
 */
async function triggerProvisionPipeline() {
  return await jenkinsService.triggerProvisionPipeline();
}

/**
 * Fetches recent Provision Server pipeline builds from jenkinsService.
 */
async function getProvisionJobs() {
  return await jenkinsService.getProvisionJobs();
}

/**
 * Returns all deployments with assigned server, timestamps, and deployment status.
 */
async function getAllAdminDeployments() {
  const deployments = await Deployment.find().sort({ createdAt: -1 });
  return deployments.map((d) => ({
    id: d._id,
    repoUrl: d.repoUrl,
    status: d.status,
    url: d.url,
    assignedServer: d.targetServer || d.serverIp || null,
    createdTime: d.createdAt,
    updatedTime: d.updatedAt,
    podName: d.podName,
    imageName: d.imageName,
    deploymentName: d.deploymentName,
    serviceName: d.serviceName,
  }));
}

/**
 * Cancels a deployment in QUEUED or BUILDING state.
 */
async function cancelDeployment(id) {
  const deployment = await Deployment.findById(id);

  if (!deployment) {
    throw new Error("Deployment not found");
  }

  if (deployment.status === "RUNNING") {
    throw new Error("Running deployments cannot be cancelled. Use rollback or stop instead.");
  }

  if (deployment.status === "CANCELLED") {
    return deployment;
  }

  if (deployment.status === "QUEUED") {
    deploymentQueueService.removeFromQueue(id);
    deployment.status = "CANCELLED";
    deployment.cancelledAt = new Date();
    deployment.logs.push("Deployment cancelled while in queue.");
    await deployment.save();
    return deployment;
  }

  // Active build in progress (BUILDING)
  deployment.status = "CANCELLED";
  deployment.cancelledAt = new Date();

  if (deployment.jenkinsBuildNumber) {
    try {
      await jenkinsService.abortBuild(jenkinsService.JENKINS_DEPLOY_JOB, deployment.jenkinsBuildNumber);
      deployment.logs.push(`Active Jenkins build #${deployment.jenkinsBuildNumber} aborted and deployment cancelled.`);
    } catch (err) {
      deployment.logs.push(`Attempted Jenkins build abort: ${err.message}`);
    }
  } else {
    deployment.logs.push("Deployment cancelled during build initialization.");
  }

  await deployment.save();
  return deployment;
}

/**
 * Initiates a rollback to the most recent successful (RUNNING) deployment for the application.
 */
async function rollbackDeployment(id, reason) {
  const targetDeployment = await Deployment.findById(id);

  if (!targetDeployment) {
    throw new Error("Target deployment not found");
  }

  const previousDeployment = await Deployment.findOne({
    repoUrl: targetDeployment.repoUrl,
    status: "RUNNING",
    _id: { $ne: targetDeployment._id },
  }).sort({ createdAt: -1 });

  if (!previousDeployment) {
    throw new Error("No previous successful deployment found to roll back to.");
  }

  const rollbackId = randomUUID();
  const rollbackDeployment = await Deployment.create({
    _id: rollbackId,
    repoUrl: previousDeployment.repoUrl,
    projectName: previousDeployment.projectName,
    projectType: previousDeployment.projectType,
    framework: previousDeployment.framework,
    buildCommand: previousDeployment.buildCommand,
    outputDirectory: previousDeployment.outputDirectory,
    status: "ROLLING_BACK",
    rolledBackFrom: targetDeployment._id,
    rollbackReason: reason || `Rollback triggered for deployment ${targetDeployment._id}`,
    logs: [
      `Rollback initiated for deployment ${targetDeployment._id}`,
      `Targeting previous successful deployment ${previousDeployment._id}`,
      `Previous image/tag: ${previousDeployment.imageName || "N/A"}`,
      "Queued for rollback execution...",
    ],
  });

  deploymentQueueService.enqueueDeployment(rollbackId);

  return rollbackDeployment;
}

/**
 * Returns all user access registration requests.
 */
async function getRegisterRequests() {
  return await RegisterRequest.find().sort({ createdAt: -1 });
}

/**
 * Approves a user access registration request and creates a corresponding User document in MongoDB.
 */
async function approveRegisterRequest(id) {
  const request = await RegisterRequest.findById(id);
  if (!request) {
    throw new Error("Registration request not found");
  }

  request.status = "APPROVED";
  await request.save();

  // Create user in User collection if not existing
  let user = await User.findOne({ username: request.username });
  if (!user) {
    const hashedPassword = await bcrypt.hash("UserDefault123!", 10);
    user = await User.create({
      username: request.username,
      password: hashedPassword,
      role: "user",
    });
  }

  return { request, user };
}

/**
 * Rejects a user access registration request.
 */
async function rejectRegisterRequest(id) {
  const request = await RegisterRequest.findById(id);
  if (!request) {
    throw new Error("Registration request not found");
  }

  request.status = "REJECTED";
  await request.save();
  return request;
}

/**
 * Triggers infrastructure destruction for a registered server via Jenkins.
 * Does NOT delete the MongoDB document immediately.
 */
async function destroyServer(serverId) {
  let server = null;
  if (serverId && serverId.match(/^[0-9a-fA-F]{24}$/)) {
    server = await Server.findById(serverId);
  }
  if (!server) {
    server = await Server.findOne({ $or: [{ name: serverId }, { instanceId: serverId }, { workspace: serverId }] });
  }

  if (!server) {
    throw new Error(`Server with ID '${serverId}' not found`);
  }

  const targetWorkspace = server.workspace || server.name || "default";
  const targetInstanceId = server.instanceId || server.name;

  const buildResult = await jenkinsService.triggerDestroyPipeline({
    TARGET_WORKSPACE: targetWorkspace,
    INSTANCE_ID: targetInstanceId,
    SERVER_ID: server._id.toString(),
  });

  return {
    success: true,
    message: `Destroy Server pipeline triggered successfully for workspace '${targetWorkspace}'`,
    serverId: server._id.toString(),
    workspace: targetWorkspace,
    instanceId: targetInstanceId,
    buildResult,
  };
}

module.exports = {
  getSystemSummary,
  getAllRegisteredServers,
  getServerDocumentById,
  triggerProvisionPipeline,
  getProvisionJobs,
  destroyServer,
  getAllAdminDeployments,
  cancelDeployment,
  rollbackDeployment,
  getRegisterRequests,
  approveRegisterRequest,
  rejectRegisterRequest,
};
