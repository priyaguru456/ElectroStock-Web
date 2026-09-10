const express = require("express");
const controller = require("./suppliers.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { createSupplierSchema, updateSupplierSchema } = require("../../validators/supplier.validator");
const { ADMIN_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", authorize(ADMIN_ROLES), validate(createSupplierSchema), controller.create);
router.put("/:id", authorize(ADMIN_ROLES), validate(updateSupplierSchema), controller.update);
router.delete("/:id", authorize(ADMIN_ROLES), controller.deactivate);

module.exports = router;
