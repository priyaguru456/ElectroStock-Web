const usersService = require("./users.service");
const { success, failure } = require("../../utils/apiResponse");

async function list(req, res, next) {
  try {
    const result = await usersService.list(req.query, req.user);
    return success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const user = await usersService.getById(Number(req.params.id));
    return success(res, user);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const user = await usersService.create(req.body, req.user.id);
    return success(res, user, "User created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await usersService.update(Number(req.params.id), req.body, req.user.id);
    return success(res, user, "User updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function setStatus(req, res, next) {
  try {
    const user = await usersService.setStatus(Number(req.params.id), req.body.status, req.user);
    return success(res, user, "User status updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, getById, create, update, setStatus };
