const express = require("express");
const authController = require("./auth.controller");
const authenticate = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");
const { loginSchema } = require("../../validators/auth.validator");
const { loginLimiter } = require("../../middleware/rateLimiter");

const router = express.Router();

router.post("/login", loginLimiter, validate(loginSchema), authController.login);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);

module.exports = router;
