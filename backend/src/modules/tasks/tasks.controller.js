const tasksService = require("./tasks.service");
const { success, failure } = require("../../utils/apiResponse");

async function list(req, res, next) {
  try {
    const result = await tasksService.list(req.query, req.user);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const task = await tasksService.create(req.body, req.user);
    return success(res, task, "Task created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function assign(req, res, next) {
  try {
    const task = await tasksService.assign(Number(req.params.id), req.body.assignedToId, req.user);
    return success(res, task, "Task assigned");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const task = await tasksService.updateStatus(Number(req.params.id), req.body.status, req.user);
    return success(res, task, "Task status updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, create, assign, updateStatus };
