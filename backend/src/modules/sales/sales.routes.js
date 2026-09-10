const express = require("express");
const controller = require("./sales.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const {
  createSalesOrderSchema,
  updateSalesOrderSchema,
  statusUpdateSchema,
} = require("../../validators/salesOrder.validator");
const { SALES_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate, authorize(SALES_ROLES));

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", validate(createSalesOrderSchema), controller.create);
router.put("/:id", validate(updateSalesOrderSchema), controller.update);
router.post("/:id/confirm", controller.confirm);
router.post("/:id/status", validate(statusUpdateSchema), controller.advanceStatus);
router.post("/:id/cancel", controller.cancel);

module.exports = router;
