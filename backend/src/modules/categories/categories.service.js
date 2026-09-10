const categoryRepository = require("../../repositories/category.repository");
const HttpError = require("../../utils/httpError");

async function list() {
  return categoryRepository.list();
}

async function getById(id) {
  const category = await categoryRepository.findById(id);
  if (!category) throw new HttpError(404, "Category not found");
  return category;
}

async function create(data) {
  const existing = await categoryRepository.findByName(data.name);
  if (existing) throw new HttpError(400, "A category with this name already exists");
  return categoryRepository.create(data);
}

async function update(id, data) {
  const category = await categoryRepository.findById(id);
  if (!category) throw new HttpError(404, "Category not found");
  return categoryRepository.update(id, data);
}

async function remove(id) {
  const category = await categoryRepository.findById(id);
  if (!category) throw new HttpError(404, "Category not found");

  const productCount = await categoryRepository.countProducts(id);
  if (productCount > 0) {
    throw new HttpError(400, "Cannot delete a category that has products assigned to it");
  }

  await categoryRepository.remove(id);
}

module.exports = { list, getById, create, update, remove };
