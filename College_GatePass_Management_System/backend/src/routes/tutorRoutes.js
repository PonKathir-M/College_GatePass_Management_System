const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/tutorController");

// Get current staff profile
router.get("/profile", auth, role(["staff"]), ctrl.getProfile);

// Pending requests for this tutor's department
router.get("/pending", auth, role(["staff"]), ctrl.pendingRequests);

// Approval actions
router.post("/approve/:id", auth, role(["staff"]), ctrl.approve);
router.post("/reject/:id", auth, role(["staff"]), ctrl.reject);
router.post("/bulk-approve", auth, role(["staff"]), ctrl.bulkApprove);
router.post("/bulk-reject", auth, role(["staff"]), ctrl.bulkReject);

// Department students
router.get("/students", auth, role(["staff"]), ctrl.getDepartmentStudents);

// Get only assigned students
router.get("/my-students", auth, role(["staff"]), ctrl.getAssignedStudents);

// Student assignment
router.post("/assign/:student_id", auth, role(["staff"]), ctrl.assignStudent);
router.post("/unassign/:student_id", auth, role(["staff"]), ctrl.unassignStudent);

// Approval history
router.get("/history", auth, role(["staff"]), ctrl.getApprovalHistory);
router.get("/student-history/:studentId", auth, role(["staff"]), ctrl.getStudentHistory);

module.exports = router;
