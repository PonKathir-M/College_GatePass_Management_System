const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/hodController");

// Pending requests awaiting HOD approval
router.get("/pending", auth, role(["hod"]), ctrl.pending);

// Approval actions
router.post("/approve/:id", auth, role(["hod"]), ctrl.approve);
router.post("/reject/:id", auth, role(["hod"]), ctrl.reject);

// Warden approval forwarding
router.post("/approve-warden/:id", auth, role(["hod"]), ctrl.approveWarden);

// Statistics
router.get("/stats", auth, role(["hod"]), ctrl.getStats);

// Student Suspension Management
router.get("/students", auth, role(["hod"]), ctrl.getDepartmentStudents);
router.post("/student/:id/suspend", auth, role(["hod"]), ctrl.suspendStudent);
router.post("/students/bulk-suspend", auth, role(["hod"]), ctrl.bulkSuspend);

// New Enhancements
router.get("/tracking", auth, role(["hod"]), ctrl.getPassTracking);
router.get("/student-history/:studentId", auth, role(["hod"]), ctrl.getStudentHistory);

module.exports = router;
