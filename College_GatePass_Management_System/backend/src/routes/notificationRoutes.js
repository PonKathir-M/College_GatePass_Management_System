const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const ctrl = require("../controllers/notificationController");

router.get("/", auth, ctrl.myNotifications);
router.post("/mark-read", auth, ctrl.markAsRead);

module.exports = router;
