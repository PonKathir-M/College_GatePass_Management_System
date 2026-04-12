const router = require("express").Router();

router.use("/auth", require("./authRoutes"));
router.use("/admin", require("./adminRoutes"));
router.use("/student", require("./studentRoutes"));
router.use("/tutor", require("./tutorRoutes"));
router.use("/hod", require("./hodRoutes"));
router.use("/warden", require("./wardenRoutes"));
router.use("/security", require("./securityRoutes"));
router.use("/notifications", require("./notificationRoutes"));

module.exports = router;
