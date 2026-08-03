const Server = require("../models/Server");

const HEARTBEAT_TIMEOUT_MS = 300000; // 5 minutes (300 seconds)

/**
 * Selects the best deployment server based on collected metrics.
 * 
 * Primary Filter:
 *  - Excludes OFFLINE servers
 *  - Excludes servers whose activeDeployments >= maxDeployments
 *  - Prefers servers with a fresh heartbeat within HEARTBEAT_TIMEOUT_MS (5 minutes)
 * 
 * Fallback:
 *  - If no server has a fresh heartbeat, selects any non-OFFLINE server with available capacity
 * 
 * Sorts candidates by:
 *  1. Lowest activeDeployments
 *  2. Lowest cpuUsage
 *  3. Lowest ramUsage
 *  4. Lowest diskUsage
 * 
 * Throws an Error if no eligible server exists.
 */
async function getDeploymentServer() {
  const servers = await Server.find({ status: { $ne: "OFFLINE" } });
  const now = Date.now();

  if (!servers || servers.length === 0) {
    throw new Error("No healthy deployment server available");
  }

  // 1. Strict Filter (Fresh Heartbeat within 5 minutes & available capacity)
  let candidates = servers.filter((server) => {
    if (server.status === "OFFLINE") return false;

    const maxCapacity = server.maxDeployments !== undefined ? server.maxDeployments : 10;
    const currentActive = server.activeDeployments || 0;
    if (currentActive >= maxCapacity) return false;

    if (!server.lastHeartbeat) return false;
    const heartbeatAge = now - new Date(server.lastHeartbeat).getTime();
    return heartbeatAge <= HEARTBEAT_TIMEOUT_MS;
  });

  // 2. Fallback Filter: If strict heartbeat check yields no candidates, use any registered non-OFFLINE server with capacity
  if (candidates.length === 0) {
    candidates = servers.filter((server) => {
      if (server.status === "OFFLINE") return false;
      const maxCapacity = server.maxDeployments !== undefined ? server.maxDeployments : 10;
      const currentActive = server.activeDeployments || 0;
      return currentActive < maxCapacity;
    });
  }

  if (candidates.length === 0) {
    throw new Error("No healthy deployment server available");
  }

  // Sort candidates according to multi-tier priority
  candidates.sort((a, b) => {
    // Priority 1: lowest activeDeployments
    const activeA = a.activeDeployments || 0;
    const activeB = b.activeDeployments || 0;
    if (activeA !== activeB) return activeA - activeB;

    // Priority 2: lowest cpuUsage
    const cpuA = a.cpuUsage || 0;
    const cpuB = b.cpuUsage || 0;
    if (cpuA !== cpuB) return cpuA - cpuB;

    // Priority 3: lowest ramUsage
    const ramA = a.ramUsage || 0;
    const ramB = b.ramUsage || 0;
    if (ramA !== ramB) return ramA - ramB;

    // Priority 4: lowest diskUsage
    const diskA = a.diskUsage || 0;
    const diskB = b.diskUsage || 0;
    return diskA - diskB;
  });

  return candidates[0];
}

module.exports = {
  getDeploymentServer,
};
