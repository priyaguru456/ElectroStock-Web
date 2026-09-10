const express = require("express");
const controller = require("./warehouses.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const {
  createWarehouseSchema,
  updateWarehouseSchema,
  assignStaffSchema,
} = require("../../validators/warehouse.validator");
const { ADMIN_ROLES, WAREHOUSE_MANAGING_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", authorize(ADMIN_ROLES), validate(createWarehouseSchema), controller.create);
router.put("/:id", authorize(ADMIN_ROLES), validate(updateWarehouseSchema), controller.update);
router.delete("/:id", authorize(ADMIN_ROLES), controller.deactivate);

router.post("/:id/staff", authorize(WAREHOUSE_MANAGING_ROLES), validate(assignStaffSchema), controller.assignStaff);
router.delete("/:id/staff/:userId", authorize(WAREHOUSE_MANAGING_ROLES), controller.unassignStaff);

module.exports = router;
