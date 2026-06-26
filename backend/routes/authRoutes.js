const express = require("express");

const auth = require("../middlewares/auth");
const checkPlano = require("../middlewares/checkPlano");

const authController = require("../controllers/authController");

const router = express.Router();

// =========================
// REGISTER
// =========================
router.post("/register", authController.register);

// =========================
// LOGIN
// =========================
router.post("/login", authController.login);

// =========================
// ME
// =========================
router.get("/me", auth, checkPlano, authController.me);

module.exports = router;