const express = require("express");
const controller = require("./categories.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { createCategorySchema, updateCategorySchema } = require("../../validators/category.validator");
const { ADMIN_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", authorize(ADMIN_ROLES), validate(createCategorySchema), controller.create);
router.put("/:id", authorize(ADMIN_ROLES), validate(updateCategorySchema), controller.update);
router.delete("/:id", authorize(ADMIN_ROLES), controller.remove);

module.exports = router;
