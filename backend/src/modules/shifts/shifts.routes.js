const express = require("express");
const controller = require("./shifts.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { createShiftSchema, updateShiftSchema } = require("../../validators/shift.validator");
const { EMPLOYEE_MANAGING_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", authorize(EMPLOYEE_MANAGING_ROLES), validate(createShiftSchema), controller.create);
router.put("/:id", authorize(EMPLOYEE_MANAGING_ROLES), validate(updateShiftSchema), controller.update);
router.delete("/:id", authorize(EMPLOYEE_MANAGING_ROLES), controller.remove);

module.exports = router;
