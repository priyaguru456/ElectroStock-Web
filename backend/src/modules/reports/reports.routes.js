const express = require("express");
const controller = require("./reports.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const { ADMIN_ROLES, WAREHOUSE_MANAGING_ROLES, SALES_ROLES } = require("../../config/constants");

const REPORT_ROLES = [...new Set([...ADMIN_ROLES, ...WAREHOUSE_MANAGING_ROLES, ...SALES_ROLES, "TEAM_LEADER"])];

const router = express.Router();

router.use(authenticate, authorize(REPORT_ROLES));

router.get("/inventory", controller.inventory);
router.get("/low-stock", controller.lowStock);
router.get("/sales", controller.sales);
router.get("/purchases", controller.purchases);
router.get("/stock-movement", controller.stockMovement);
router.get("/employee-performance", controller.employeePerformance);

module.exports = router;
