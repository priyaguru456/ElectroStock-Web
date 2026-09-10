const attendanceService = require("./attendance.service");
const { success, failure } = require("../../utils/apiResponse");

async function checkIn(req, res, next) {
  try {
    const record = await attendanceService.checkIn(req.user.id);
    return success(res, record, "Checked in");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function checkOut(req, res, next) {
  try {
    const record = await attendanceService.checkOut(req.user.id);
    return success(res, record, "Checked out");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function myHistory(req, res, next) {
  try {
    const result = await attendanceService.history(req.user.id, req.query, req.user);
    return success(res, result);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function employeeHistory(req, res, next) {
  try {
    const result = await attendanceService.history(Number(req.params.employeeId), req.query, req.user);
    return success(res, result);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { checkIn, checkOut, myHistory, employeeHistory };
