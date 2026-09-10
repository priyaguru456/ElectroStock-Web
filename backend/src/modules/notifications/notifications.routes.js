const express = require("express");
const controller = require("./notifications.controller");
const authenticate = require("../../middleware/authenticate");

const router = express.Router();

router.use(authenticate);

router.get("/", controller.list);
router.put("/read-all", controller.markAllRead);
router.put("/:id/read", controller.markRead);

module.exports = router;
