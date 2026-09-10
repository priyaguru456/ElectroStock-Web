const service = require("./customers.service");
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
    return success(res, await service.create(req.body), "Customer created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    return success(res, await service.update(Number(req.params.id), req.body), "Customer updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    return success(res, await service.deactivate(Number(req.params.id)), "Customer deactivated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, getById, create, update, deactivate };
