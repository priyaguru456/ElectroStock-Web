const service = require("./warehouses.service");
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
    return success(res, await service.create(req.body), "Warehouse created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    return success(res, await service.update(Number(req.params.id), req.body), "Warehouse updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    return success(res, await service.deactivate(Number(req.params.id)), "Warehouse deactivated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function assignStaff(req, res, next) {
  try {
    const result = await service.assignStaff(Number(req.params.id), req.body.userId);
    return success(res, result, "Staff assigned", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function unassignStaff(req, res, next) {
  try {
    await service.unassignStaff(Number(req.params.id), Number(req.params.userId));
    return success(res, null, "Staff unassigned");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, getById, create, update, deactivate, assignStaff, unassignStaff };
