const adminService = require("../services/adminService");

/**
 * Controller for GET /admin/system
 */
async function getSystemSummary(req, res) {
  try {
    const summary = await adminService.getSystemSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for GET /admin/servers
 */
async function getServers(req, res) {
  try {
    const servers = await adminService.getAllRegisteredServers();
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for GET /admin/servers/:id
 */
async function getServerById(req, res) {
  try {
    const server = await adminService.getServerDocumentById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }
    res.json(server);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for DELETE /admin/servers/:id
 */
async function destroyServer(req, res) {
  try {
    const result = await adminService.destroyServer(req.params.id);
    res.status(202).json(result);
  } catch (error) {
    if (error.message && error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for POST /admin/provision
 */
async function triggerProvision(req, res) {
  try {
    const result = await adminService.triggerProvisionPipeline();
    res.status(202).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for GET /admin/provision/jobs
 */
async function getProvisionJobs(req, res) {
  try {
    const jobs = await adminService.getProvisionJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for GET /admin/deployments
 */
async function getDeployments(req, res) {
  try {
    const deployments = await adminService.getAllAdminDeployments();
    res.json(deployments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for POST /admin/deployments/:id/cancel
 */
async function cancelDeployment(req, res) {
  try {
    const deployment = await adminService.cancelDeployment(req.params.id);
    res.json({
      success: true,
      message: "Deployment cancelled successfully",
      deployment,
    });
  } catch (error) {
    const statusCode = error.message.includes("Running deployments cannot be cancelled") ? 400 : 500;
    res.status(statusCode).json({ error: error.message });
  }
}

/**
 * Controller for POST /admin/deployments/:id/rollback
 */
async function rollbackDeployment(req, res) {
  try {
    const rollback = await adminService.rollbackDeployment(req.params.id, req.body.reason);
    res.status(202).json({
      success: true,
      message: "Rollback initiated successfully",
      rollbackDeploymentId: rollback._id,
      status: rollback.status,
      rollback,
    });
  } catch (error) {
    const statusCode = error.message.includes("No previous successful deployment found") ? 400 : 500;
    res.status(statusCode).json({ error: error.message });
  }
}

/**
 * Controller for GET /admin/requests
 */
async function getRequests(req, res) {
  try {
    const requests = await adminService.getRegisterRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for POST /admin/requests/:id/approve
 */
async function approveRequest(req, res) {
  try {
    const result = await adminService.approveRegisterRequest(req.params.id);
    res.json({
      success: true,
      message: `Request approved for ${result.request.username}. User account created.`,
      result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for POST /admin/requests/:id/reject
 */
async function rejectRequest(req, res) {
  try {
    const request = await adminService.rejectRegisterRequest(req.params.id);
    res.json({
      success: true,
      message: `Request rejected for ${request.username}.`,
      request,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getSystemSummary,
  getServers,
  getServerById,
  destroyServer,
  triggerProvision,
  getProvisionJobs,
  getDeployments,
  cancelDeployment,
  rollbackDeployment,
  getRequests,
  approveRequest,
  rejectRequest,
};
