const express = require("express");
const usersController = require("./users.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { createUserSchema, updateUserSchema, updateStatusSchema } = require("../../validators/user.validator");
const { ADMIN_ROLES, USER_MANAGING_ROLES } = require("../../config/constants");

const router = express.Router();

router.use(authenticate);

router.get("/", authorize(USER_MANAGING_ROLES), usersController.list);
router.get("/:id", authorize(USER_MANAGING_ROLES), usersController.getById);
router.post("/", authorize(USER_MANAGING_ROLES), validate(createUserSchema), usersController.create);
router.put("/:id", authorize(ADMIN_ROLES), validate(updateUserSchema), usersController.update);
router.post(
  "/:id/status",
  authorize(USER_MANAGING_ROLES),
  validate(updateStatusSchema),
  usersController.setStatus
);

module.exports = router;
