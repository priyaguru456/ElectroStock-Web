const express = require("express");
const controller = require("./purchases.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  receiveSchema,
} = require("../../validators/purchaseOrder.validator");
const { WAREHOUSE_MANAGING_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate, authorize(WAREHOUSE_MANAGING_ROLES));

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", validate(createPurchaseOrderSchema), controller.create);
router.put("/:id", validate(updatePurchaseOrderSchema), controller.update);
router.post("/:id/order", controller.markOrdered);
router.post("/:id/receive", validate(receiveSchema), controller.receive);
router.post("/:id/cancel", controller.cancel);

module.exports = router;
