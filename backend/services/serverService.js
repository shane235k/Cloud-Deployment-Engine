const Server = require("../models/Server");

/**
 * Registers a new server or updates an existing server document.
 * Identifies servers primarily by workspace.
 */
async function registerServer(data) {
  const {
    name,
    publicIp,
    privateIp,
    sshUser,
    clusterType,
    maxDeployments,
    status,
    workspace,
    instanceId,
    terraformManaged,
  } = data;

  if (!name || !publicIp) {
    throw new Error("name and publicIp are required for server registration");
  }

  const targetWorkspace = workspace || name || "default";
  const targetInstanceId = instanceId || name;
  const isTerraformManaged = terraformManaged !== undefined ? Boolean(terraformManaged) : true;

  let server = null;

  // Primary lookup by workspace
  if (workspace) {
    server = await Server.findOne({ workspace });
  }

  // Secondary fallback lookup by workspace, instanceId, name, or publicIp
  if (!server) {
    server = await Server.findOne({
      $or: [
        { workspace: targetWorkspace },
        { instanceId: targetInstanceId },
        { name },
        { publicIp },
      ],
    });
  }

  if (server) {
    server.name = name;
    server.publicIp = publicIp;
    server.workspace = targetWorkspace;
    server.instanceId = targetInstanceId;
    if (terraformManaged !== undefined) {
      server.terraformManaged = isTerraformManaged;
    }
    if (privateIp !== undefined) server.privateIp = privateIp;
    if (sshUser !== undefined) server.sshUser = sshUser;
    if (clusterType !== undefined) server.clusterType = clusterType;
    if (maxDeployments !== undefined) server.maxDeployments = maxDeployments;
    if (status !== undefined) server.status = status;
    server.consecutiveFailures = 0;
    server.lastHeartbeat = new Date();
    server.lastPollAttempt = new Date();
    await server.save();
    return server;
  }

  server = await Server.create({
    name,
    publicIp,
    workspace: targetWorkspace,
    instanceId: targetInstanceId,
    terraformManaged: isTerraformManaged,
    privateIp: privateIp || "",
    sshUser: sshUser || "ubuntu",
    clusterType: clusterType || "k3s",
    maxDeployments: maxDeployments !== undefined ? maxDeployments : 10,
    status: status || "HEALTHY",
    consecutiveFailures: 0,
    lastHeartbeat: new Date(),
    lastPollAttempt: new Date(),
  });

  return server;
}

/**
 * Updates heartbeat metrics for an existing server.
 */
async function updateHeartbeat(data) {
  const { name, instanceId, workspace, cpuUsage, ramUsage, diskUsage, uptime, podCount, activeDeployments, status } = data;

  let server = null;
  if (workspace) {
    server = await Server.findOne({ workspace });
  }
  if (!server && instanceId) {
    server = await Server.findOne({ instanceId });
  }
  if (!server && name) {
    server = await Server.findOne({ name });
  }

  if (!server) {
    return null;
  }

  if (cpuUsage !== undefined) server.cpuUsage = cpuUsage;
  if (ramUsage !== undefined) server.ramUsage = ramUsage;
  if (diskUsage !== undefined) server.diskUsage = diskUsage;
  if (uptime !== undefined) server.uptime = uptime;
  if (podCount !== undefined) server.podCount = podCount;
  if (activeDeployments !== undefined) server.activeDeployments = activeDeployments;
  if (status !== undefined) server.status = status;

  server.consecutiveFailures = 0;
  server.lastHeartbeat = new Date();
  await server.save();

  return server;
}

/**
 * Marks server as failed or unreachable.
 */
async function recordFailure(serverId) {
  const server = await Server.findById(serverId);
  if (!server) return null;

  server.consecutiveFailures += 1;
  if (server.consecutiveFailures >= 3) {
    server.status = "OFFLINE";
  }
  await server.save();
  return server;
}

/**
 * Fetches all healthy servers for scheduling.
 */
async function getHealthyServers() {
  return await Server.find({ status: "HEALTHY" }).sort({ activeDeployments: 1 });
}

/**
 * Fetches all servers for admin monitoring.
 */
async function getAllServers() {
  return await Server.find().sort({ createdAt: -1 });
}

module.exports = {
  registerServer,
  updateHeartbeat,
  recordFailure,
  getHealthyServers,
  getAllServers,
};
