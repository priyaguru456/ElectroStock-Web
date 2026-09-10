const service = require("./inventory.service");
const { success, failure } = require("../../utils/apiResponse");

async function getStock(req, res, next) {
  try {
    return success(res, await service.getStock(req.user, req.query));
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function getTransactions(req, res, next) {
  try {
    return success(res, await service.getTransactions(req.user, req.query));
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function createAdjustment(req, res, next) {
  try {
    const adjustment = await service.createAdjustment(req.user, req.body);
    return success(res, adjustment, "Stock adjustment recorded", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function getAdjustments(req, res, next) {
  try {
    return success(res, await service.getAdjustments(req.user, req.query));
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { getStock, getTransactions, createAdjustment, getAdjustments };
