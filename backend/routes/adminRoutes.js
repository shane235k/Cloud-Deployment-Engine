const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Infrastructure & System routes
router.get("/system", adminController.getSystemSummary);
router.get("/servers", adminController.getServers);
router.get("/servers/:id", adminController.getServerById);
router.delete("/servers/:id", adminController.destroyServer);

// Provisioning routes
router.post("/provision", adminController.triggerProvision);
router.get("/provision/jobs", adminController.getProvisionJobs);

// Access Requests routes
router.get("/requests", adminController.getRequests);
router.post("/requests/:id/approve", adminController.approveRequest);
router.post("/requests/:id/reject", adminController.rejectRequest);

module.exports = router;
