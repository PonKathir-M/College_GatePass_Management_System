const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/adminController");

const upload = require("../middleware/upload");

/* ============== DEPARTMENTS ============== */
router.post("/department", auth, role(["admin"]), ctrl.createDepartment);
router.get("/department", auth, role(["admin"]), ctrl.getDepartments);
router.put("/department/:id", auth, role(["admin"]), ctrl.updateDepartment);
router.delete("/department/:id", auth, role(["admin"]), ctrl.deleteDepartment);

/* ============== STAFF ============== */
router.post("/staff/upload", auth, role(["admin"]), upload.single('file'), ctrl.uploadStaffCSV);
router.post("/staff", auth, role(["admin"]), ctrl.createStaff);
router.get("/staff", auth, role(["admin"]), ctrl.getStaff);
router.put("/staff/:id", auth, role(["admin"]), ctrl.updateStaff);
router.post("/staff/:id/deactivate", auth, role(["admin"]), ctrl.deactivateStaff);
router.post("/staff/:id/reset-password-flag", auth, role(["admin"]), ctrl.resetStaffPasswordFlag);

/* ============== STUDENTS ============== */
router.post("/student/upload", auth, role(["admin"]), upload.single('file'), ctrl.uploadStudentCSV);
router.post("/student", auth, role(["admin"]), upload.single('profile_pic'), ctrl.createStudent);
router.get("/student", auth, role(["admin"]), ctrl.getStudents);
router.put("/student/:id", auth, role(["admin"]), upload.single('profile_pic'), ctrl.updateStudent);
router.post("/student/:id/deactivate", auth, role(["admin"]), ctrl.deactivateStudent);
router.post("/student/:id/reset-password-flag", auth, role(["admin"]), ctrl.allowPasswordChange);

/* ============== HOD ASSIGNMENT ============== */
router.post("/assign-hod", auth, role(["admin"]), ctrl.assignHOD);

/* ============== ANALYTICS & REPORTS ============== */
router.get("/analytics", auth, role(["admin"]), ctrl.analytics);
router.get("/dashboard-stats", auth, role(["admin"]), ctrl.getDashboardStats);
router.get("/daily-stats", auth, role(["admin"]), ctrl.getDailyStats);
router.get("/live-status", auth, role(["admin"]), ctrl.getLiveStatus);
router.get("/advanced-stats", auth, role(["admin"]), ctrl.getAdvancedStats);

module.exports = router;
