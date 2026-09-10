const service = require("./sales.service");
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
    return success(res, await service.create(req.body, req.user.id), "Sales order created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    return success(res, await service.update(Number(req.params.id), req.body), "Sales order updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function confirm(req, res, next) {
  try {
    return success(res, await service.confirm(Number(req.params.id), req.user.id), "Sales order confirmed");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function advanceStatus(req, res, next) {
  try {
    return success(res, await service.advanceStatus(Number(req.params.id), req.body.status), "Status updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function cancel(req, res, next) {
  try {
    return success(res, await service.cancel(Number(req.params.id), req.user.id), "Sales order cancelled");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, getById, create, update, confirm, advanceStatus, cancel };
