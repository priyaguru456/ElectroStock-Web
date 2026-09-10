const express = require("express");
const controller = require("./attendance.controller");
const authenticate = require("../../middleware/authenticate");

const router = express.Router();

router.use(authenticate);

router.post("/check-in", controller.checkIn);
router.post("/check-out", controller.checkOut);
router.get("/me", controller.myHistory);
router.get("/:employeeId", controller.employeeHistory);

module.exports = router;
