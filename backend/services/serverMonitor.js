const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const fs = require("fs");
const path = require("path");
const serverService = require("./serverService");

const MONITOR_INTERVAL_MS = parseInt(process.env.MONITOR_INTERVAL_MS || "30000", 10);
let monitorInterval = null;
let isPolling = false;

/**
 * Resolves an existing, valid SSH key path from possible locations.
 */
function resolveSshKeyPath() {
  const candidates = [
    process.env.SSH_KEY_PATH,
    "/app/keys/p377-key.pem",
    "/tmp/p377-key.pem",
    "C:/Users/ARYAN SINGH/Downloads/p377-key.pem",
    "C:/nvm/COLLEGE/DEVOPS/KubeDeploy/p377-key.pem",
    path.join(__dirname, "../p377-key.pem"),
    path.join(__dirname, "../../p377-key.pem"),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Executes SSH command on target server and extracts system/Kubernetes metrics for user applications.
 */
async function fetchServerMetrics(server) {
  const sshKey = resolveSshKeyPath();
  const sshUser = server.sshUser || process.env.SSH_USER || "ubuntu";
  const publicIp = server.publicIp;

  if (!publicIp) {
    throw new Error("Target server publicIp is missing");
  }

  if (!sshKey) {
    const err = new Error(`SSH key file not found on backend system. Checked SSH_KEY_PATH (${process.env.SSH_KEY_PATH})`);
    err.isKeyMissing = true;
    throw err;
  }

  // Base64-encoded bash payload to query system load and user pods/deployments (excluding kube-system)
  const rawScript = `
cpu=$(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' 2>/dev/null || echo "0")
ram=$(free | awk '/Mem:/ {if ($2>0) printf "%.0f", $3/$2 * 100; else print "0"}' 2>/dev/null || echo "0")
disk=$(df -P / | awk 'NR==2 {gsub(/%/, ""); print $5}' 2>/dev/null || echo "0")
up=$(uptime -p 2>/dev/null || uptime 2>/dev/null || echo "unknown")

pods=$(sudo k3s kubectl get pods -n default --no-headers 2>/dev/null | grep -v 'No resources' | wc -l || kubectl get pods -n default --no-headers 2>/dev/null | grep -v 'No resources' | wc -l || echo "0")
deps=$(sudo k3s kubectl get deployments -n default --no-headers 2>/dev/null | grep -v 'No resources' | wc -l || kubectl get deployments -n default --no-headers 2>/dev/null | grep -v 'No resources' | wc -l || echo "0")

echo "CPU:$cpu"
echo "RAM:$ram"
echo "DISK:$disk"
echo "UPTIME:$up"
echo "PODS:$pods"
echo "DEPS:$deps"
`.trim();

  const b64Payload = Buffer.from(rawScript).toString("base64");
  const sshCmd = `ssh -q -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=5 -i "${sshKey}" ${sshUser}@${publicIp} "echo ${b64Payload} | base64 -d | bash"`;

  const { stdout } = await execAsync(sshCmd, { encoding: "utf8", timeout: 15000, shell: true });

  const metrics = {
    cpuUsage: 0,
    ramUsage: 0,
    diskUsage: 0,
    uptime: "",
    podCount: 0,
    activeDeployments: 0,
  };

  const lines = stdout.split("\n");
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("CPU:")) {
      metrics.cpuUsage = Math.round(parseFloat(trimmed.substring(4)) || 0);
    } else if (trimmed.startsWith("RAM:")) {
      metrics.ramUsage = Math.round(parseFloat(trimmed.substring(4)) || 0);
    } else if (trimmed.startsWith("DISK:")) {
      metrics.diskUsage = Math.round(parseFloat(trimmed.substring(5)) || 0);
    } else if (trimmed.startsWith("UPTIME:")) {
      metrics.uptime = trimmed.substring(7).trim();
    } else if (trimmed.startsWith("PODS:")) {
      metrics.podCount = parseInt(trimmed.substring(5).trim(), 10) || 0;
    } else if (trimmed.startsWith("DEPS:")) {
      metrics.activeDeployments = parseInt(trimmed.substring(5).trim(), 10) || 0;
    }
  });

  return metrics;
}

/**
 * Polls all registered servers every 30s.
 * Updates metrics and live user pod/deployment capacity on success.
 */
async function pollServers() {
  if (isPolling) return;
  isPolling = true;

  try {
    const servers = await serverService.getMonitoredServers();
    if (!servers || servers.length === 0) {
      isPolling = false;
      return;
    }

    await Promise.all(
      servers.map(async (server) => {
        try {
          const metrics = await fetchServerMetrics(server);
          const maxDeployments = server.maxDeployments || 10;
          
          // Reconcile capacity from actual user deployments / pods detected on EC2
          const liveActiveCount = Math.max(metrics.activeDeployments, metrics.podCount > 0 ? metrics.podCount : 0);
          const status = liveActiveCount >= maxDeployments ? "BUSY" : "HEALTHY";

          await serverService.recordPollSuccess(server._id, {
            ...metrics,
            activeDeployments: liveActiveCount,
            status,
          });
        } catch (error) {
          console.warn(`[ServerMonitor] Poll failure for ${server.name} (${server.publicIp}): ${error.message}`);
          await serverService.recordPollFailure(server._id, error.message, !!error.isKeyMissing);
        }
      })
    );
  } catch (err) {
    console.error("[ServerMonitor] Error during server polling cycle:", err.message);
  } finally {
    isPolling = false;
  }
}

/**
 * Starts the continuous asynchronous backend server monitor.
 */
function startMonitoring() {
  if (monitorInterval) {
    return;
  }

  console.log(`[ServerMonitor] Starting backend server monitor (interval: ${MONITOR_INTERVAL_MS}ms)...`);
  
  pollServers().catch((err) => {
    console.error("[ServerMonitor] Initial poll error:", err.message);
  });

  monitorInterval = setInterval(pollServers, MONITOR_INTERVAL_MS);
}

/**
 * Stops the backend server monitor.
 */
function stopMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log("[ServerMonitor] Stopped backend server monitor.");
  }
}

module.exports = {
  startMonitoring,
  stopMonitoring,
  pollServers,
  resolveSshKeyPath,
};
