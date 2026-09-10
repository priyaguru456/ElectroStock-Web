const express = require("express");
const controller = require("./audit.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const { ADMIN_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate, authorize(ADMIN_ROLES));

router.get("/", controller.list);

module.exports = router;
