const express = require("express");
const controller = require("./departments.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { createDepartmentSchema, updateDepartmentSchema } = require("../../validators/department.validator");
const { EMPLOYEE_MANAGING_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", authorize(EMPLOYEE_MANAGING_ROLES), validate(createDepartmentSchema), controller.create);
router.put("/:id", authorize(EMPLOYEE_MANAGING_ROLES), validate(updateDepartmentSchema), controller.update);
router.delete("/:id", authorize(EMPLOYEE_MANAGING_ROLES), controller.remove);

module.exports = router;
