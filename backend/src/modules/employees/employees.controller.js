const employeesService = require("./employees.service");
const { success, failure } = require("../../utils/apiResponse");

async function list(req, res, next) {
  try {
    const result = await employeesService.list(req.query, req.user);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const employee = await employeesService.getById(Number(req.params.id), req.user);
    return success(res, employee);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const employee = await employeesService.create(req.body, req.user);
    return success(res, employee, "Employee created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const employee = await employeesService.update(Number(req.params.id), req.body, req.user);
    return success(res, employee, "Employee updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function assign(req, res, next) {
  try {
    const employee = await employeesService.assign(Number(req.params.id), req.body, req.user);
    return success(res, employee, "Employee assignment updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, getById, create, update, assign };
