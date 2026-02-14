const router = require("express").Router();
const { login, createInitialAdmin, changePassword } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

router.post("/login", login);
router.post("/create-admin", createInitialAdmin);
router.post("/change-password", auth, changePassword);

module.exports = router;