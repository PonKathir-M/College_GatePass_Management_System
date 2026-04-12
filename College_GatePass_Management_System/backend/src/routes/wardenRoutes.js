const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/wardenController");

// Hosteller early morning requests
router.get("/requests", auth, role(["warden"]), ctrl.hostellerRequests);

// Approval actions
router.post("/approve/:id", auth, role(["warden"]), ctrl.approve);
router.post("/reject/:id", auth, role(["warden"]), ctrl.reject);

// Statistics
router.get("/stats", auth, role(["warden"]), ctrl.getStats);

// Student List (Hostellers)
router.get("/students", auth, role(["warden"]), ctrl.getStudents);

// Departments List
router.get("/departments", auth, role(["warden"]), ctrl.getDepartments);

module.exports = router;
