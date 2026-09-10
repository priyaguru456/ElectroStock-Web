const categoriesService = require("./categories.service");
const { success, failure } = require("../../utils/apiResponse");

async function list(req, res, next) {
  try {
    const items = await categoriesService.list();
    return success(res, items);
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const item = await categoriesService.getById(Number(req.params.id));
    return success(res, item);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const item = await categoriesService.create(req.body);
    return success(res, item, "Category created", 201);
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const item = await categoriesService.update(Number(req.params.id), req.body);
    return success(res, item, "Category updated");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    await categoriesService.remove(Number(req.params.id));
    return success(res, null, "Category deleted");
  } catch (err) {
    if (err.status) return failure(res, err.message, err.status);
    return next(err);
  }
}

module.exports = { list, getById, create, update, remove };
