const express = require("express");
const controller = require("./tasks.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const {
  createTaskSchema,
  assignTaskSchema,
  updateTaskStatusSchema,
} = require("../../validators/task.validator");
const { EMPLOYEE_VIEWING_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.post("/", authorize(EMPLOYEE_VIEWING_ROLES), validate(createTaskSchema), controller.create);
router.patch("/:id/assign", authorize(EMPLOYEE_VIEWING_ROLES), validate(assignTaskSchema), controller.assign);
router.patch("/:id/status", validate(updateTaskStatusSchema), controller.updateStatus);

module.exports = router;
