const express = require("express");
const controller = require("./customers.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { createCustomerSchema, updateCustomerSchema } = require("../../validators/customer.validator");
const { SALES_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", authorize(SALES_ROLES), validate(createCustomerSchema), controller.create);
router.put("/:id", authorize(SALES_ROLES), validate(updateCustomerSchema), controller.update);
router.delete("/:id", authorize(SALES_ROLES), controller.deactivate);

module.exports = router;
