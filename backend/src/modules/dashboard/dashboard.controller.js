const service = require("./dashboard.service");
const { success } = require("../../utils/apiResponse");

async function getSummary(req, res, next) {
  try {
    return success(res, await service.getSummary(req.user));
  } catch (err) {
    return next(err);
  }
}

async function getTopSellingProducts(req, res, next) {
  try {
    return success(res, await service.getTopSellingProducts(req.user, req.query.limit ? Number(req.query.limit) : 5));
  } catch (err) {
    return next(err);
  }
}

async function getEmployeeDashboard(req, res, next) {
  try {
    return success(res, await service.getEmployeeDashboard(req.user));
  } catch (err) {
    return next(err);
  }
}

async function getManagerDashboard(req, res, next) {
  try {
    return success(res, await service.getManagerDashboard(req.user));
  } catch (err) {
    return next(err);
  }
}

module.exports = { getSummary, getTopSellingProducts, getEmployeeDashboard, getManagerDashboard };
