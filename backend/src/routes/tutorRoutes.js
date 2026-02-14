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

// Department students
router.get("/students", auth, role(["staff"]), ctrl.getDepartmentStudents);

// Get only assigned students
router.get("/my-students", auth, role(["staff"]), ctrl.getAssignedStudents);

// Student assignment
router.post("/assign/:student_id", auth, role(["staff"]), ctrl.assignStudent);
router.post("/unassign/:student_id", auth, role(["staff"]), ctrl.unassignStudent);

// Approval history
router.get("/history", auth, role(["staff"]), ctrl.getApprovalHistory);

// Student History for popup
router.get("/student-history/:studentId", auth, role(["staff"]), ctrl.getStudentHistory);

// Announcements
router.post("/announcements", auth, role(["staff"]), ctrl.createAnnouncement);
router.get("/announcements", auth, role(["staff"]), ctrl.getAnnouncements);
router.delete("/announcements/:id", auth, role(["staff"]), ctrl.deleteAnnouncement);

module.exports = router;
