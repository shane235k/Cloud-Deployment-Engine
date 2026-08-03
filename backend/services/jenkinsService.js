const axios = require("axios");

// Read configuration entirely from environment variables
const JENKINS_URL = process.env.JENKINS_URL || "http://host.docker.internal:8080";
const JENKINS_USER = process.env.JENKINS_USER || "";
const JENKINS_TOKEN = process.env.JENKINS_TOKEN || "";
const JENKINS_DEPLOY_JOB = process.env.JENKINS_DEPLOY_JOB || process.env.JENKINS_JOB || "kubedeploy-stable";
const JENKINS_PROVISION_JOB = process.env.JENKINS_PROVISION_JOB || "Provision-Server";
const JENKINS_DESTROY_JOB = process.env.JENKINS_DESTROY_JOB || "Destroy-Server";

/**
 * Construct Basic Authorization header for Jenkins REST API requests.
 */
function getJenkinsAuthHeader() {
  if (JENKINS_USER && JENKINS_TOKEN) {
    const auth = Buffer.from(`${JENKINS_USER}:${JENKINS_TOKEN}`).toString("base64");
    return { Authorization: `Basic ${auth}` };
  }
  return {};
}

/**
 * Triggers the deployment Jenkins pipeline with specified parameters.
 */
async function triggerDeploymentPipeline(parameters) {
  const baseUrl = JENKINS_URL.replace(/\/$/, "");
  const jobName = encodeURIComponent(JENKINS_DEPLOY_JOB);
  const url = `${baseUrl}/job/${jobName}/buildWithParameters`;

  const headers = getJenkinsAuthHeader();

  try {
    const response = await axios.post(url, null, {
      params: parameters,
      headers,
      timeout: 10000,
    });

    return {
      success: true,
      status: response.status,
      queueLocation: response.headers.location || null,
    };
  } catch (error) {
    throw new Error(`Failed to trigger deployment pipeline (${JENKINS_DEPLOY_JOB}): ${error.message}`);
  }
}

/**
 * Helper to compute the next unique workspace name (worker-1, worker-2, etc.) from registered servers.
 */
async function getNextWorkspaceName() {
  try {
    const Server = require("../models/Server");
    const servers = await Server.find({}, "workspace name");
    let maxIndex = 0;

    for (const s of servers) {
      const ws = s.workspace || s.name || "";
      const match = ws.match(/^worker-(\d+)$/i);
      if (match) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIndex) {
          maxIndex = idx;
        }
      }
    }

    return `worker-${maxIndex + 1}`;
  } catch (err) {
    return `worker-1`;
  }
}

/**
 * Triggers the server provision Jenkins pipeline.
 * Automatically computes and passes TARGET_WORKSPACE (e.g. worker-1, worker-2) if not supplied.
 */
async function triggerProvisionPipeline(parameters = {}) {
  let targetWorkspace = parameters?.TARGET_WORKSPACE;

  if (!targetWorkspace) {
    targetWorkspace = await getNextWorkspaceName();
  }

  const finalParams = {
    ...parameters,
    TARGET_WORKSPACE: targetWorkspace,
  };

  const baseUrl = JENKINS_URL.replace(/\/$/, "");
  const jobName = encodeURIComponent(JENKINS_PROVISION_JOB);
  const url = `${baseUrl}/job/${jobName}/buildWithParameters`;

  const headers = getJenkinsAuthHeader();

  try {
    const response = await axios.post(url, null, {
      params: finalParams,
      headers,
      timeout: 10000,
    });

    return {
      success: true,
      status: response.status,
      workspace: targetWorkspace,
      queueLocation: response.headers.location || null,
    };
  } catch (error) {
    throw new Error(`Failed to trigger provision pipeline (${JENKINS_PROVISION_JOB}) for workspace ${targetWorkspace}: ${error.message}`);
  }
}

/**
 * Triggers the server destroy Jenkins pipeline.
 */
async function triggerDestroyPipeline(parameters) {
  const baseUrl = JENKINS_URL.replace(/\/$/, "");
  const jobName = encodeURIComponent(JENKINS_DESTROY_JOB);
  const url = `${baseUrl}/job/${jobName}/buildWithParameters`;

  const headers = getJenkinsAuthHeader();

  try {
    const response = await axios.post(url, null, {
      params: parameters,
      headers,
      timeout: 10000,
    });

    return {
      success: true,
      status: response.status,
      queueLocation: response.headers.location || null,
    };
  } catch (error) {
    throw new Error(`Failed to trigger destroy pipeline (${JENKINS_DESTROY_JOB}): ${error.message}`);
  }
}

/**
 * Aborts an active build in Jenkins via REST API.
 */
async function abortBuild(jobName = JENKINS_DEPLOY_JOB, buildNumber) {
  const baseUrl = JENKINS_URL.replace(/\/$/, "");
  const stopUrl = `${baseUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/stop`;
  const headers = getJenkinsAuthHeader();

  try {
    const response = await axios.post(stopUrl, null, { headers, timeout: 10000 });
    return { success: true, status: response.status };
  } catch (error) {
    try {
      const abortUrl = `${baseUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/term`;
      const response = await axios.post(abortUrl, null, { headers, timeout: 10000 });
      return { success: true, status: response.status };
    } catch (fallbackError) {
      throw new Error(`Failed to abort Jenkins build #${buildNumber}: ${error.message}`);
    }
  }
}

/**
 * Checks if a specific Jenkins build is currently running.
 */
async function isBuildRunning(jobName = JENKINS_DEPLOY_JOB, buildNumber) {
  const baseUrl = JENKINS_URL.replace(/\/$/, "");
  const apiUrl = `${baseUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json`;
  const headers = getJenkinsAuthHeader();

  try {
    const response = await axios.get(apiUrl, { headers, timeout: 5000 });
    return response.data?.building === true;
  } catch (err) {
    return false;
  }
}

/**
 * Polls the Jenkins Queue item until an executable build number is assigned.
 * Implements exponential backoff for network resilience.
 */
async function waitForBuildStart(queueUrl, timeoutMs = 300000) {
  const headers = getJenkinsAuthHeader();
  const startTime = Date.now();
  let attempts = 0;

  let apiUrl = queueUrl ? queueUrl.replace(/\/$/, "") + "/api/json" : null;

  while (Date.now() - startTime < timeoutMs) {
    attempts++;
    try {
      if (apiUrl) {
        const response = await axios.get(apiUrl, { headers, timeout: 5000 });
        if (response.data && response.data.executable) {
          return {
            buildNumber: response.data.executable.number,
            buildUrl: response.data.executable.url,
          };
        }
      } else {
        const jobs = await getDeploymentJobs();
        if (jobs && jobs.length > 0) {
          return {
            buildNumber: jobs[0].buildNumber,
            buildUrl: jobs[0].url,
          };
        }
      }
    } catch (err) {
      const delay = Math.min(10000, Math.pow(1.5, Math.min(attempts, 8)) * 1000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const jobs = await getDeploymentJobs();
  if (jobs && jobs.length > 0) {
    return {
      buildNumber: jobs[0].buildNumber,
      buildUrl: jobs[0].url,
    };
  }

  throw new Error("Timed out waiting for Jenkins to assign a build number");
}

/**
 * Polls a specific Jenkins build until it completes execution.
 * Implements exponential backoff for network resilience.
 */
async function waitForBuildCompletion(jobName = JENKINS_DEPLOY_JOB, buildNumber, timeoutMs = 600000) {
  const baseUrl = JENKINS_URL.replace(/\/$/, "");
  const apiUrl = `${baseUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/api/json`;
  const headers = getJenkinsAuthHeader();
  const startTime = Date.now();
  let attempts = 0;

  while (Date.now() - startTime < timeoutMs) {
    attempts++;
    try {
      const response = await axios.get(apiUrl, { headers, timeout: 5000 });
      const data = response.data;

      if (data && (data.building === false || data.result !== null)) {
        return {
          result: data.result || "SUCCESS",
          duration: data.duration || 0,
          timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : null,
          url: data.url,
        };
      }
    } catch (err) {
      const delay = Math.min(10000, Math.pow(1.5, Math.min(attempts, 8)) * 1000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  return {
    result: "FAILURE",
    duration: Date.now() - startTime,
    url: `${baseUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/`,
    error: "Timed out waiting for build completion",
  };
}

/**
 * Fetches raw console text log for a specific build.
 */
async function getBuildConsole(jobName = JENKINS_DEPLOY_JOB, buildNumber) {
  const baseUrl = JENKINS_URL.replace(/\/$/, "");
  const consoleUrl = `${baseUrl}/job/${encodeURIComponent(jobName)}/${buildNumber}/consoleText`;
  const headers = getJenkinsAuthHeader();

  try {
    const response = await axios.get(consoleUrl, { headers, timeout: 10000 });
    return response.data;
  } catch (err) {
    return "";
  }
}

/**
 * Returns recent build records for the deployment pipeline.
 */
async function getDeploymentJobs() {
  const baseUrl = JENKINS_URL.replace(/\/$/, "");
  const jobName = encodeURIComponent(JENKINS_DEPLOY_JOB);
  const url = `${baseUrl}/job/${jobName}/api/json?tree=builds[number,result,duration,timestamp,url]`;

  const headers = getJenkinsAuthHeader();

  try {
    const response = await axios.get(url, { headers, timeout: 10000 });
    const builds = response.data?.builds || [];
    return builds.map((b) => ({
      buildNumber: b.number,
      status: b.result || "IN_PROGRESS",
      duration: b.duration,
      timestamp: b.timestamp ? new Date(b.timestamp).toISOString() : null,
      url: b.url,
    }));
  } catch (error) {
    console.warn(`[jenkinsService] Could not fetch deployment jobs: ${error.message}`);
    return [];
  }
}

/**
 * Returns recent build records for the server provision pipeline.
 */
async function getProvisionJobs() {
  const baseUrl = JENKINS_URL.replace(/\/$/, "");
  const jobName = encodeURIComponent(JENKINS_PROVISION_JOB);
  const url = `${baseUrl}/job/${jobName}/api/json?tree=builds[number,result,duration,timestamp,url]`;

  const headers = getJenkinsAuthHeader();

  try {
    const response = await axios.get(url, { headers, timeout: 10000 });
    const builds = response.data?.builds || [];
    return builds.map((b) => ({
      buildNumber: b.number,
      status: b.result || "IN_PROGRESS",
      duration: b.duration,
      timestamp: b.timestamp ? new Date(b.timestamp).toISOString() : null,
      url: b.url,
    }));
  } catch (error) {
    console.warn(`[jenkinsService] Could not fetch provision jobs: ${error.message}`);
    return [];
  }
}

module.exports = {
  triggerDeploymentPipeline,
  triggerProvisionPipeline,
  triggerDestroyPipeline,
  abortBuild,
  isBuildRunning,
  waitForBuildStart,
  waitForBuildCompletion,
  getBuildConsole,
  getDeploymentJobs,
  getProvisionJobs,
  JENKINS_DEPLOY_JOB,
  JENKINS_PROVISION_JOB,
  JENKINS_DESTROY_JOB,
};
