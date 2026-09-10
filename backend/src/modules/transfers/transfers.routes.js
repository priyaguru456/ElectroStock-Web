const express = require("express");
const controller = require("./transfers.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { createTransferSchema } = require("../../validators/stockTransfer.validator");
const { WAREHOUSE_MANAGING_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate, authorize(WAREHOUSE_MANAGING_ROLES));

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", validate(createTransferSchema), controller.create);
router.post("/:id/complete", controller.complete);
router.post("/:id/cancel", controller.cancel);

module.exports = router;
