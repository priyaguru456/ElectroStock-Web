const service = require("./suppliers.service");
const { success, failure } = require("../../utils/apiResponse");

async function list(req, res, next) {
  try {
    const items = await service.list(req.query);
    return success(res, items);
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const item = await service.getById(Number(req.params.id));
    return success(res, item);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const item = await service.create(req.body);
    return success(res, item, "Supplier created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const item = await service.update(Number(req.params.id), req.body);
    return success(res, item, "Supplier updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    const item = await service.deactivate(Number(req.params.id));
    return success(res, item, "Supplier deactivated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, getById, create, update, deactivate };
