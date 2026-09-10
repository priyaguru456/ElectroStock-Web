const express = require("express");
const controller = require("./products.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { createProductSchema, updateProductSchema } = require("../../validators/product.validator");
const { ADMIN_ROLES, WAREHOUSE_MANAGING_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", authorize(WAREHOUSE_MANAGING_ROLES), validate(createProductSchema), controller.create);
router.put("/:id", authorize(WAREHOUSE_MANAGING_ROLES), validate(updateProductSchema), controller.update);
router.delete("/:id", authorize(ADMIN_ROLES), controller.deactivate);

module.exports = router;
