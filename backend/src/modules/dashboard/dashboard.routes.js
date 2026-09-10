const express = require("express");
const controller = require("./dashboard.controller");
const authenticate = require("../../middleware/authenticate");

const router = express.Router();

router.use(authenticate);

router.get("/summary", controller.getSummary);
router.get("/top-products", controller.getTopSellingProducts);
router.get("/employee", controller.getEmployeeDashboard);
router.get("/manager", controller.getManagerDashboard);

module.exports = router;
