const express = require("express");
const controller = require("./inventory.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { createAdjustmentSchema } = require("../../validators/stockAdjustment.validator");
const { WAREHOUSE_MANAGING_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.getStock);
router.get("/transactions", controller.getTransactions);

router.get("/adjustments", controller.getAdjustments);
router.post(
  "/adjustments",
  authorize(WAREHOUSE_MANAGING_ROLES),
  validate(createAdjustmentSchema),
  controller.createAdjustment
);

module.exports = router;
