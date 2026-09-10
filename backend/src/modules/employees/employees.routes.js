const express = require("express");
const controller = require("./employees.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  assignEmployeeSchema,
} = require("../../validators/employee.validator");
const { EMPLOYEE_VIEWING_ROLES, EMPLOYEE_MANAGING_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", authorize(EMPLOYEE_VIEWING_ROLES), controller.list);
router.get("/:id", controller.getById);
router.post("/", authorize(EMPLOYEE_MANAGING_ROLES), validate(createEmployeeSchema), controller.create);
router.put("/:id", authorize(EMPLOYEE_VIEWING_ROLES), validate(updateEmployeeSchema), controller.update);
router.post(
  "/:id/assign",
  authorize(EMPLOYEE_VIEWING_ROLES),
  validate(assignEmployeeSchema),
  controller.assign
);

module.exports = router;
