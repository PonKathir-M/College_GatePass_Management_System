const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/studentController");

// Gate Pass Operations
router.post("/gatepass", auth, role(["student"]), ctrl.applyGatePass);
router.get("/gatepass", auth, role(["student"]), ctrl.myGatePasses);
router.get("/gatepass/:id", auth, role(["student"]), ctrl.getGatePassDetail);
router.delete("/gatepass/:id", auth, role(["student"]), ctrl.cancelGatePass);

// Profile
router.get("/profile", auth, role(["student"]), ctrl.getProfile);
router.get("/announcements", auth, role(["student"]), ctrl.getAnnouncements);

module.exports = router;
