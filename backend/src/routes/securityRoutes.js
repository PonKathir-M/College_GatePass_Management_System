const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/securityController");

// Approved passes to check
router.get("/approved-passes", auth, role(["security"]), ctrl.getApprovedPasses);

// Security logs
router.get("/logs", auth, role(["security"]), ctrl.getLogs);

// Completed History
router.get("/history", auth, role(["security"]), ctrl.getCompletedPasses);

// Mark student movement
router.post("/mark-out", auth, role(["security"]), ctrl.markStudentOut);
router.post("/mark-in", auth, role(["security"]), ctrl.markStudentIn);

// Statistics
router.get("/stats", auth, role(["security"]), ctrl.getTodayStats);

module.exports = router;
