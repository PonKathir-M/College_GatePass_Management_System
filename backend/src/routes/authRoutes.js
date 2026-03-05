const router = require("express").Router();
const { login, createInitialAdmin } = require("../controllers/authController");

router.post("/login", login);
router.post("/create-admin", createInitialAdmin);

module.exports = router;