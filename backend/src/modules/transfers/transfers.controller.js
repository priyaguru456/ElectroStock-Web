const service = require("./transfers.service");
const { success, failure } = require("../../utils/apiResponse");

async function list(req, res, next) {
  try {
    return success(res, await service.list(req.query));
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    return success(res, await service.getById(Number(req.params.id)));
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    return success(res, await service.create(req.body, req.user.id), "Stock transfer created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function complete(req, res, next) {
  try {
    return success(res, await service.complete(Number(req.params.id), req.user.id), "Stock transfer completed");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function cancel(req, res, next) {
  try {
    return success(res, await service.cancel(Number(req.params.id)), "Stock transfer cancelled");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, getById, create, complete, cancel };
