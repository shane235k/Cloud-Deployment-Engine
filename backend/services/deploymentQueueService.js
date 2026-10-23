const Deployment = require("../models/Deployment");
const Infrastructure = require("../models/Infrastructure");
const scheduler = require("./scheduler");
const jenkinsService = require("./jenkinsService");

// In-process sequential queue backed by MongoDB state
const queue = [];
let isProcessing = false;
let isProvisioningInProgress = false;

/**
 * Pushes a deployment ID into the queue and starts processing if idle.
 */
function enqueueDeployment(deploymentId) {
  if (!queue.includes(deploymentId)) {
    queue.push(deploymentId);
  }
  processQueue();
}

/**
 * Processes deployments sequentially in background.
 */
async function processQueue() {
  if (isProcessing || queue.length === 0) {
    return;
  }

  isProcessing = true;
  const deploymentId = queue.shift();

  try {
    await executeDeployment(deploymentId);
  } catch (err) {
    console.error(`[DeploymentQueue] Error processing deployment ${deploymentId}:`, err.message);
  } finally {
    isProcessing = false;
    // Process next queued deployment recursively
    processQueue();
  }
}

/**
 * Complete deployment workflow execution for a single job.
 * Tracks full Jenkins build lifecycle: trigger -> queue -> build start -> build completion -> status.
 */
async function executeDeployment(deploymentId) {
  const deployment = await Deployment.findById(deploymentId);

  if (!deployment) {
    console.warn(`[DeploymentQueue] Deployment ${deploymentId} not found in DB`);
    return;
  }

  // Skip if already finished or stopped
  if (["RUNNING", "FAILED", "STOPPED"].includes(deployment.status)) {
    return;
  }

  // Update status from QUEUED to BUILDING
  deployment.status = "BUILDING";
  deployment.logs.push("Processing queued deployment job...");
  await deployment.save();

  let server = null;

  try {
    try {
      server = await scheduler.getDeploymentServer();
    } catch (schedError) {
      if (schedError.message.includes("No healthy deployment server available")) {
        deployment.logs.push("No healthy server available");
        await deployment.save();

        if (!isProvisioningInProgress) {
          isProvisioningInProgress = true;
          deployment.logs.push("No healthy server available. Initializing automatic server provisioning...");
          await deployment.save();

          try {
            await jenkinsService.triggerProvisionPipeline();
            deployment.logs.push("Provision pipeline triggered");
            await deployment.save();
          } catch (provErr) {
            isProvisioningInProgress = false;
            throw new Error(`Automatic server provisioning failed to trigger: ${provErr.message}`);
          }
        } else {
          deployment.logs.push("Another deployment has already triggered server provisioning. Waiting for newly provisioned server...");
          await deployment.save();
        }

        // Poll MongoDB every 10 seconds for up to 10 minutes (60 iterations)
        const pollIntervalMs = 10000;
        const maxPollAttempts = 60;
        let serverFound = false;

        for (let attempt = 1; attempt <= maxPollAttempts; attempt++) {
          deployment.logs.push("Waiting for server registration");
          await deployment.save();

          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

          try {
            server = await scheduler.getDeploymentServer();
            if (server) {
              serverFound = true;
              isProvisioningInProgress = false;
              deployment.logs.push("New server registered");
              deployment.logs.push("Retrying scheduler");
              deployment.logs.push(`Deployment resumed. Assigned target server IP: ${server.publicIp}`);
              await deployment.save();
              break;
            }
          } catch (_) {
            // Still waiting for healthy server registration...
          }
        }

        if (!serverFound || !server) {
          isProvisioningInProgress = false;
          throw new Error("Automatic server provisioning timed out after 10 minutes. No healthy deployment server registered.");
        }
      } else {
        throw schedError;
      }
    }

    const infra = await Infrastructure.findOne();
    const albDns = infra?.albDns || "kubedeploy-alb-881970620.us-east-2.elb.amazonaws.com";

    // Trigger Jenkins deployment pipeline via jenkinsService
    deployment.serverIp = server.publicIp;
    deployment.directUrl = `http://${server.publicIp}:80/apps/${deploymentId}/`;

    const triggerRes = await jenkinsService.triggerDeploymentPipeline({
      REPO_URL: deployment.repoUrl,
      DEPLOYMENT_ID: deploymentId,
      TARGET_SERVER: server.publicIp,
      ALB_DNS: albDns,
    });

    deployment.logs.push("Jenkins job triggered successfully.");
    deployment.logs.push("Waiting for Jenkins executor");
    await deployment.save();

    // 1. Poll Jenkins queue until build starts & number is assigned
    const buildInfo = await jenkinsService.waitForBuildStart(triggerRes.queueLocation);
    
    // Re-fetch in case logs were pushed
    let currentDep = await Deployment.findById(deploymentId) || deployment;
    currentDep.jenkinsBuildNumber = buildInfo.buildNumber;
    currentDep.jenkinsBuildUrl = buildInfo.buildUrl;
    currentDep.pipelineStartedAt = new Date();
    currentDep.logs.push(`Build #${buildInfo.buildNumber} started`);
    currentDep.logs.push("Pipeline running");
    await currentDep.save();

    // 2. Poll Jenkins build until execution completes
    const buildResult = await jenkinsService.waitForBuildCompletion(
      jenkinsService.JENKINS_DEPLOY_JOB,
      buildInfo.buildNumber
    );

    // Re-fetch fresh deployment to prevent overwriting url/podName/serviceName set by Jenkins status updates
    const freshDeployment = await Deployment.findById(deploymentId) || currentDep;

    freshDeployment.jenkinsResult = buildResult.result;
    freshDeployment.pipelineFinishedAt = new Date();

    if (buildResult.result === "SUCCESS") {
      freshDeployment.logs.push("Pipeline completed");
      if (freshDeployment.status !== "FAILED") {
        freshDeployment.status = "RUNNING";
      }
    } else {
      freshDeployment.status = "FAILED";
      freshDeployment.logs.push("Pipeline failed");
    }

    await freshDeployment.save();
  } catch (error) {
    try {
      const freshDeployment = await Deployment.findById(deploymentId) || deployment;
      freshDeployment.status = "FAILED";
      freshDeployment.logs.push(`Failed to trigger Jenkins: ${error.message}`);
      await freshDeployment.save();
    } catch (_) {}
  }
}

/**
 * Resumes processing for any unhandled deployments on backend startup/restart.
 */
async function resumeQueuedDeployments() {
  try {
    const unfinishedDeployments = await Deployment.find({
      status: { $in: ["QUEUED", "BUILDING"] },
    }).sort({ createdAt: 1 });

    if (unfinishedDeployments.length > 0) {
      console.log(`[DeploymentQueue] Resuming ${unfinishedDeployments.length} unfinished deployment(s)...`);
      unfinishedDeployments.forEach((d) => {
        if (!queue.includes(d._id)) {
          queue.push(d._id);
        }
      });
      processQueue();
    }
  } catch (err) {
    console.error("[DeploymentQueue] Failed to recover queued deployments on startup:", err.message);
  }
}

/**
 * Removes a deployment ID from the in-memory queue if present.
 * Returns true if removed, false otherwise.
 */
function removeFromQueue(deploymentId) {
  const index = queue.indexOf(deploymentId);
  if (index !== -1) {
    queue.splice(index, 1);
    return true;
  }
  return false;
}

module.exports = {
  enqueueDeployment,
  removeFromQueue,
  resumeQueuedDeployments,
};
