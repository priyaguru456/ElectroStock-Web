const prisma = require("../config/db");

function list() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

function findById(id) {
  return prisma.category.findUnique({ where: { id } });
}

function findByName(name) {
  return prisma.category.findUnique({ where: { name } });
}

function create(data) {
  return prisma.category.create({ data });
}

function update(id, data) {
  return prisma.category.update({ where: { id }, data });
}

function countProducts(categoryId) {
  return prisma.product.count({ where: { categoryId } });
}

function remove(id) {
  return prisma.category.delete({ where: { id } });
}

module.exports = { list, findById, findByName, create, update, countProducts, remove };
