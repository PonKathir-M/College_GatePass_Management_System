const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const {
  login,
  createInitialAdmin,
  getCurrentUser,
  changePassword
} = require("../controllers/authController");

router.post("/login", login);
router.post("/create-admin", createInitialAdmin);
router.get("/me", auth, getCurrentUser);
router.post("/change-password", auth, changePassword);

module.exports = router;
