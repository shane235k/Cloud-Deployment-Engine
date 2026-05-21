const { webcrypto } = require("crypto");
global.crypto = webcrypto;
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const RegisterRequest = require("./models/RegisterRequest");
const Deployment = require('./models/Deployment');
const deployToKubernetes = require("./deployToKubernetes");
const { randomUUID } = require("crypto");
const UserProfile = require("./models/UserProfile");
const jwt = require("jsonwebtoken");
const { execSync } = require("child_process");
const util = require('util');
const execAsync = util.promisify(require('child_process').exec);

const ADMIN_USERNAME = "shane";
const ADMIN_PASSWORD = "X2rj3xs5*";
const JWT_SECRET = process.env.JWT_SECRET || "uiugwdhwgyy4ugf3f98cy5c3nty394xyr9nx93";
require("dotenv").config();
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));
console.log("MONGODB_URI =", process.env.MONGODB_URI);
console.log("JENKINS_URL =", process.env.JENKINS_URL);
console.log("JENKINS_USER =", process.env.JENKINS_USER);
console.log("JENKINS_TOKEN =", process.env.JENKINS_TOKEN?.slice(0, 5) + "...");
console.log("JENKINS_JOB =", process.env.JENKINS_JOB);


const app = express();
const PORT = process.env.PORT || 5000;
let runtimePrometheusUrl =
  process.env.PROMETHEUS_URL || "";

let runtimeGrafanaUrl =
  process.env.GRAFANA_URL || "";

global.runtimePrometheusUrl =
  runtimePrometheusUrl;

app.use(cors());
app.use(express.json());
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      error: "Invalid token",
    });
  }
}
app.post("/monitoring/config", (req, res) => {
  const { prometheusUrl, grafanaUrl } =
    req.body;

  if (prometheusUrl) {
    runtimePrometheusUrl = prometheusUrl;
    global.runtimePrometheusUrl =
      prometheusUrl;
  }

  if (grafanaUrl) {
    runtimeGrafanaUrl = grafanaUrl;
  }

  res.json({
    success: true,
    prometheusUrl: runtimePrometheusUrl,
    grafanaUrl: runtimeGrafanaUrl,
  });
});

app.get("/monitoring/config", (req, res) => {
  res.json({
    prometheusUrl: runtimePrometheusUrl,
    grafanaUrl: runtimeGrafanaUrl,
  });
});
//Profile routes
app.get("/profile", authenticate, async (req, res) => {
  try {
    let profile = await UserProfile.findOne({
      userId: req.user.userId,
    });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.user.userId,
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    res.status(500).json({
      error: "Failed to fetch profile",
    });
  }
});

app.put("/profile", authenticate, async (req, res) => {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      {
        userId: req.user.userId,
      },
      {
        ...req.body,
        userId: req.user.userId,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json(profile);
  } catch (error) {
    console.error("Failed to update profile:", error);
    res.status(500).json({
      error: "Failed to update profile",
    });
  }
});
// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "KubeDeploy backend is running",
  });
});
app.post("/auth/register-request", async (req, res) => {
  const { username, email, message } = req.body;

  await RegisterRequest.create({
    username,
    email,
    message,
  });

  res.json({
    success: true,
    message: "Request submitted successfully.",
  });
});

app.get("/github/client-id", (req, res) => {
  res.json({ clientId: process.env.GITHUB_CLIENT_ID });
});

app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!code) {
    return res.redirect(`${frontendUrl}/dashboard/new?github_error=no_code`);
  }

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res.redirect(`${frontendUrl}/dashboard/new?github_error=no_token`);
    }

    res.redirect(`${frontendUrl}/dashboard/new?github_token=${accessToken}`);
  } catch (error) {
    console.error("GitHub OAuth callback error:", error.message);
    res.redirect(`${frontendUrl}/dashboard/new?github_error=auth_failed`);
  }
});

app.post("/github/save-token", authenticate, async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: "No token provided" });

  try {
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    await UserProfile.findOneAndUpdate(
      { userId: req.user.userId },
      {
        githubAccessToken: accessToken,
        githubUsername: userResponse.data.login
      },
      { upsert: true }
    );

    res.json({ success: true, githubUsername: userResponse.data.login });
  } catch (error) {
    console.error("GitHub save-token error:", error.message);
    res.status(500).json({ error: "Failed to save GitHub token" });
  }
});


app.get("/github/repos", authenticate, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.userId });
    if (!profile || !profile.githubAccessToken) {
      return res.status(401).json({ error: "Not connected to GitHub" });
    }

    const reposResponse = await axios.get("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: { Authorization: `Bearer ${profile.githubAccessToken}` }
    });

    const repos = reposResponse.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      clone_url: repo.clone_url,
      private: repo.private,
      updated_at: repo.updated_at
    }));

    res.json(repos);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ error: "GitHub token expired or invalid" });
    }
    console.error("GitHub repos fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

app.post("/deploy", async (req, res) => {
  const {
    repoUrl,
    projectName,
    projectType,
    framework,
    buildCommand,
    outputDirectory,
  } = req.body;

  if (!repoUrl || !projectName) {
    return res.status(400).json({
      error: "repoUrl is required",
    });
  }

  const deploymentId = randomUUID();

  const deployment = await Deployment.create({
    _id: deploymentId,
    repoUrl,
    projectName,
    projectType: projectType || 'frontend',
    framework: framework || 'react',
    buildCommand: buildCommand || 'npm run build',
    outputDirectory: outputDirectory || 'dist',
    status: 'BUILDING',
    logs: [
      'Deployment created',
      `Project Name: ${projectName}`,
      `Repository URL: ${repoUrl}`,
      `Project Type: ${projectType || 'frontend'}`,
      `Framework: ${framework || 'react'}`,
      `Build Command: ${buildCommand || 'npm run build'}`,
      `Output Directory: ${outputDirectory || 'dist'}`,
      'Triggering Jenkins pipeline...',
    ],
  });

  try {

    await axios.post(
      `${process.env.JENKINS_URL}/job/${process.env.JENKINS_JOB}/buildWithParameters`,
      null,
      {
        params: {
          REPO_URL: repoUrl,
          DEPLOYMENT_ID: deploymentId,
        },
        auth: {
          username: process.env.JENKINS_USER,
          password: process.env.JENKINS_TOKEN,
        },
      }
    );

    deployment.logs.push('Jenkins job triggered successfully.');
    await deployment.save();
  } catch (error) {
    deployment.status = 'FAILED';
    deployment.logs.push('Failed to trigger Jenkins.', error.message);
    await deployment.save();
  }

  res.json({
    deploymentId,
    status: deployment.status,
  });
});
app.post("/deployments/:id/image-built", async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    deployment.logs.push("Docker image built successfully.");
    deployment.logs.push("Deploying to Kubernetes...");
    await deployment.save();

    const result = deployToKubernetes(req.params.id);
    deployment.podName = result.podName;
    deployment.status = "RUNNING";
    deployment.url = result.url;
    deployment.imageName = result.imageName;
    deployment.deploymentName = result.deploymentName;
    deployment.serviceName = result.serviceName;
    deployment.logs.push(`Application deployed successfully.`);
    deployment.logs.push(`URL: ${result.url}`);

    await deployment.save();

    res.json({ success: true, url: result.url });
  } catch (error) {
    console.error(error);

    const deployment = await Deployment.findById(req.params.id);
    if (deployment) {
      deployment.status = "FAILED";
      deployment.logs.push(`Deployment failed: ${error.message}`);
      await deployment.save();
    }

    res.status(500).json({ error: error.message });
  }
});
app.get("/test-kubectl", (req, res) => {
  const { execSync } = require("child_process");

  try {
    const output = execSync("kubectl get nodes", {
      encoding: "utf8",
    });

    res.json({
      success: true,
      output,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      stderr: error.stderr?.toString(),
    });
  }
});
app.post("/deployments/:id/status", async (req, res) => {
  try {
    console.log("=== STATUS UPDATE REQUEST RECEIVED ===");
    console.log("Deployment ID:", req.params.id);
    console.log("Request Body:", JSON.stringify(req.body, null, 2));

    const { status, url, log } = req.body;

    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      console.log("Deployment not found.");
      return res.status(404).json({ error: "Deployment not found" });
    }

    console.log("Current podName in DB:", deployment.podName);

    if (status) {
      deployment.status = status;
      console.log("Updated status:", status);
    }

    if (url) {
      deployment.url = url;
      console.log("Updated URL:", url);
    }

    if (log) {
      deployment.logs.push(log);
      console.log("Added log entry:", log);
    }

    if (req.body.podName) {
      deployment.podName = req.body.podName;
      console.log("Updated podName:", req.body.podName);
    }

    if (req.body.imageName) {
      deployment.imageName = req.body.imageName;
      console.log("Updated imageName:", req.body.imageName);
    }

    if (req.body.deploymentName) {
      deployment.deploymentName = req.body.deploymentName;
      console.log("Updated deploymentName:", req.body.deploymentName);
    }

    if (req.body.serviceName) {
      deployment.serviceName = req.body.serviceName;
      console.log("Updated serviceName:", req.body.serviceName);
    }

    await deployment.save();

    console.log("=== DOCUMENT SAVED SUCCESSFULLY ===");

    const updatedDeployment = await Deployment.findById(req.params.id);

    console.log("Saved podName:", updatedDeployment.podName);
    console.log("Saved imageName:", updatedDeployment.imageName);
    console.log("Saved deploymentName:", updatedDeployment.deploymentName);
    console.log("Saved serviceName:", updatedDeployment.serviceName);
    console.log("====================================");

    res.json({ success: true });
  } catch (error) {
    console.error("Status update failed:", error);
    res.status(500).json({ error: "Failed to update deployment" });
  }
});

app.get('/deployments/:id', async (req, res) => {
  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }

  res.json(deployment);
});
app.get('/deployments', async (req, res) => {
  const deployments = await Deployment.find().sort({ createdAt: -1 });
  res.json(deployments);
});
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const token = jwt.sign(
    {
      userId: user._id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.json({
    token,
    user: {
      username: user.username,
      role: user.role,
    },
  });
});
app.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      user: {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      },
    });
  } catch {
    res.status(401).json({
      error: "Invalid token",
    });
  }
});

// STOP DEPLOYMENT
app.post("/deployments/:id/stop", async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    if (!deployment.deploymentName) {
      return res.status(400).json({
        error: "deploymentName not found in deployment record",
      });
    }

    if (!deployment.url) {
      return res.status(400).json({
        error: "Deployment URL not found",
      });
    }

    const publicIp = new URL(deployment.url).hostname;
    const sshKey = process.env.SSH_KEY_PATH;
    const sshUser = process.env.SSH_USER || "ubuntu";

    if (!sshKey) {
      return res.status(500).json({
        error: "SSH_KEY_PATH is not configured",
      });
    }

    const command = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i "${sshKey}" ${sshUser}@${publicIp} "sudo k3s kubectl scale deployment ${deployment.deploymentName} --replicas=0"`;

    execSync(command, {
      stdio: "pipe",
      encoding: "utf8",
      shell: true,
    });

    deployment.status = "STOPPED";
    deployment.logs.push("Deployment stopped successfully.");
    await deployment.save();

    res.json({
      success: true,
      message: "Deployment stopped successfully.",
      status: deployment.status,
    });
  } catch (error) {
    console.error("Stop deployment error:", error);

    res.status(500).json({
      error: "Failed to stop deployment",
      details: error.message,
    });
  }
});


// START DEPLOYMENT
app.post("/deployments/:id/start", async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    if (!deployment.deploymentName) {
      return res.status(400).json({
        error: "deploymentName not found in deployment record",
      });
    }

    if (!deployment.url) {
      return res.status(400).json({
        error: "Deployment URL not found",
      });
    }

    const publicIp = new URL(deployment.url).hostname;
    const sshKey = process.env.SSH_KEY_PATH;
    const sshUser = process.env.SSH_USER || "ubuntu";

    if (!sshKey) {
      return res.status(500).json({
        error: "SSH_KEY_PATH is not configured",
      });
    }

    const command = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i "${sshKey}" ${sshUser}@${publicIp} "sudo k3s kubectl scale deployment ${deployment.deploymentName} --replicas=1 && sudo k3s kubectl rollout status deployment/${deployment.deploymentName} --timeout=300s"`;

    execSync(command, {
      stdio: "pipe",
      encoding: "utf8",
      shell: true,
    });

    deployment.status = "RUNNING";
    deployment.logs.push("Deployment started successfully.");

    // Query for the new active pod name
    try {
      const getPodCommand = `ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i "${sshKey}" ${sshUser}@${publicIp} "sudo k3s kubectl get pods -l app=${deployment.deploymentName} -o jsonpath='{.items[0].metadata.name}'"`;
      const newPodName = execSync(getPodCommand, {
        encoding: "utf8",
        shell: true
      }).trim();
      
      if (newPodName) {
        console.log("Updating pod name after restart to:", newPodName);
        deployment.podName = newPodName;
        deployment.logs.push(`Successfully updated pod metadata: ${newPodName}`);
      }
    } catch (podErr) {
      console.error("Failed to fetch new pod name:", podErr.message);
      deployment.logs.push(`Warning: Failed to fetch new pod name after start: ${podErr.message}`);
    }

    await deployment.save();

    res.json({
      success: true,
      message: "Deployment started successfully.",
      status: deployment.status,
      url: deployment.url
    });
  } catch (error) {
    console.error("Start deployment error:", error);

    res.status(500).json({
      error: "Failed to start deployment",
      details: error.message,
    });
  }
});
app.get("/monitoring", async (req, res) => {
  try {
    const totalDeployments =
      await Deployment.countDocuments();

    const runningDeployments =
      await Deployment.countDocuments({
        status: "RUNNING",
      });

    const failedDeployments =
      await Deployment.countDocuments({
        status: "FAILED",
      });

    const buildingDeployments =
      await Deployment.countDocuments({
        status: "BUILDING",
      });

    // Total pods from Prometheus
    const podResult = await queryPrometheus(
      "count(kube_pod_info)"
    );

    const podCount =
      podResult.length > 0
        ? Math.round(
          Number(podResult[0].value[1])
        )
        : 0;

    // Ready nodes from Prometheus
    const nodeResult = await queryPrometheus(
      'count(kube_node_status_condition{condition="Ready",status="true"})'
    );

    const nodeCount =
      nodeResult.length > 0
        ? Math.round(
          Number(nodeResult[0].value[1])
        )
        : 0;

    // Cluster health
    let clusterStatus = "Healthy";

    if (nodeCount === 0) {
      clusterStatus = "Unavailable";
    } else if (failedDeployments > 0) {
      clusterStatus = "Warning";
    }

    res.json({
      totalDeployments,
      runningDeployments,
      failedDeployments,
      buildingDeployments,
      podCount,
      nodeCount,
      clusterStatus,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Monitoring error:", error);

    res.status(500).json({
      error: "Failed to fetch monitoring data",
      details: error.message,
    });
  }
});
// app.get("/deployments/:id/metrics", async (req, res) => {
//   try {
//     const deployment = await Deployment.findById(req.params.id);

//     if (!deployment) {
//       return res.status(404).json({
//         error: "Deployment not found",
//       });
//     }

//     // Use the exact stored pod name
//     const podName = deployment.podName;

//     if (!podName) {
//       return res.json({
//         cpu: "N/A",
//         memory: "N/A",
//         restarts: 0,
//         podStatus: "Unknown",
//         podName: "N/A",
//       });
//     }

//     // CPU usage in cores
//     const cpuResult = await queryPrometheus(
//       `sum(rate(container_cpu_usage_seconds_total{pod="${podName}",container!="POD"}[5m]))`
//     );

//     let cpu = "N/A";

//     if (cpuResult.length > 0) {
//       const cores = Number(cpuResult[0].value[1]);
//       cpu = `${Math.round(cores * 1000)}m`;
//     }

//     // Memory usage in bytes
//     const memoryResult = await queryPrometheus(
//       `sum(container_memory_working_set_bytes{pod="${podName}",container!="POD"})`
//     );

//     let memory = "N/A";

//     if (memoryResult.length > 0) {
//       const bytes = Number(memoryResult[0].value[1]);
//       memory = `${Math.round(bytes / 1024 / 1024)}Mi`;
//     }

//     // Restart count
//     const restartResult = await queryPrometheus(
//       `sum(kube_pod_container_status_restarts_total{pod="${podName}"})`
//     );

//     const restarts =
//       restartResult.length > 0
//         ? Math.round(Number(restartResult[0].value[1]))
//         : 0;

//     // Pod status
//     const phaseResult = await queryPrometheus(
//       `kube_pod_status_phase{pod="${podName}",phase="Running"}`
//     );

//     const podStatus =
//       phaseResult.length > 0 ? "Running" : "Unknown";

//     res.json({
//       cpu,
//       memory,
//       restarts,
//       podStatus,
//       podName,
//     });
//   } catch (error) {
//     console.error("Deployment metrics error:", error);

//     res.status(500).json({
//       error: "Failed to fetch deployment metrics",
//       details: error.message,
//     });
//   }
// });
app.get("/deployments/:id/metrics", async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.id);

    if (!deployment) {
      return res.status(404).json({
        error: "Deployment not found",
      });
    }

    const podName = deployment.podName;

    // Handle stopped state gracefully without calling SSH/kubectl
    if (deployment.status === "STOPPED") {
      return res.json({
        cpu: "N/A",
        memory: "N/A",
        restarts: 0,
        podStatus: "Stopped",
        podName: podName || "N/A",
      });
    }

    // If pod metadata has not been saved yet
    if (!podName || podName === "not yet created") {
      return res.json({
        cpu: "N/A",
        memory: "N/A",
        restarts: 0,
        podStatus: "Unknown",
        podName: podName || "N/A",
      });
    }

    if (!deployment.url) {
      return res.json({
        cpu: "N/A",
        memory: "N/A",
        restarts: 0,
        podStatus: "Unknown",
        podName,
      });
    }

    const publicIp = new URL(deployment.url).hostname;

    const sshKey = process.env.SSH_KEY_PATH;
    const sshUser = process.env.SSH_USER || "ubuntu";

    if (!sshKey) {
      throw new Error("SSH_KEY_PATH is not defined in environment variables");
    }

    console.log("Fetching metrics for pod:", podName);
    console.log("Connecting to EC2 host:", publicIp);

    const sshCmdPrefix = `ssh -q -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i "${sshKey}" ${sshUser}@${publicIp}`;

    const [statusResult, restartResult, topResult] = await Promise.allSettled([
      execAsync(`${sshCmdPrefix} "sudo k3s kubectl get pod ${podName} -o jsonpath='{.status.phase}'"`, { encoding: "utf8", shell: true }),
      execAsync(`${sshCmdPrefix} "sudo k3s kubectl get pod ${podName} -o jsonpath='{.status.containerStatuses[0].restartCount}'"`, { encoding: "utf8", shell: true }),
      execAsync(`${sshCmdPrefix} "sudo k3s kubectl top pod ${podName} --no-headers"`, { encoding: "utf8", shell: true })
    ]);

    const podStatus = statusResult.status === 'fulfilled' ? statusResult.value.stdout.trim() : 'Unknown';
    const restarts = restartResult.status === 'fulfilled' ? Number(restartResult.value.stdout.trim() || 0) : 0;

    let cpu = "N/A";
    let memory = "N/A";

    if (topResult.status === 'fulfilled') {
      const parts = topResult.value.stdout.trim().split(/\s+/);
      if (parts.length >= 3) {
        cpu = parts[1];
        memory = parts[2];
      }
    } else {
      console.log("kubectl top unavailable:", topResult.reason?.message);
    }

    res.json({
      cpu,
      memory,
      restarts,
      podStatus,
      podName,
    });
  } catch (error) {
    console.error("Deployment metrics error:", error);

    res.status(500).json({
      error: "Failed to fetch deployment metrics",
      details: error.message,
    });
  }
});
const { queryPrometheus } = require("./prometheus");

app.get("/test-prometheus", async (req, res) => {
  try {
    // Count all running pods in the cluster
    const result = await queryPrometheus(
      'count(kube_pod_info)'
    );

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Prometheus test failed:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.listen(5000, '0.0.0.0', () => {
  console.log(`KubeDeploy backend running on http://localhost:${PORT}`);
});


