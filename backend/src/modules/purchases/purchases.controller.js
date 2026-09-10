const service = require("./purchases.service");
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
    return success(res, await service.create(req.body, req.user.id), "Purchase order created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    return success(res, await service.update(Number(req.params.id), req.body), "Purchase order updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function markOrdered(req, res, next) {
  try {
    return success(res, await service.markOrdered(Number(req.params.id)), "Purchase order marked as ordered");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function cancel(req, res, next) {
  try {
    return success(res, await service.cancel(Number(req.params.id), req.user.id), "Purchase order cancelled");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function receive(req, res, next) {
  try {
    const result = await service.receive(Number(req.params.id), req.body.items, req.user.id);
    return success(res, result, "Items received");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, getById, create, update, markOrdered, cancel, receive };
