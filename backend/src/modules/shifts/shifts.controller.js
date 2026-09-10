const shiftsService = require("./shifts.service");
const { success, failure } = require("../../utils/apiResponse");

async function list(req, res, next) {
  try {
    const items = await shiftsService.list();
    return success(res, items);
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const item = await shiftsService.getById(Number(req.params.id));
    return success(res, item);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const item = await shiftsService.create(req.body, req.user.id);
    return success(res, item, "Shift created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const item = await shiftsService.update(Number(req.params.id), req.body, req.user.id);
    return success(res, item, "Shift updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await shiftsService.remove(Number(req.params.id));
    return success(res, null, "Shift deleted");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, getById, create, update, remove };
