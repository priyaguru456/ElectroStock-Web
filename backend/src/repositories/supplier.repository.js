const prisma = require("../config/db");

function list({ search, isActive } = {}) {
  const where = {};
  if (isActive !== undefined) where.isActive = isActive;
  if (search) where.name = { contains: search };
  return prisma.supplier.findMany({ where, orderBy: { name: "asc" } });
}

function findById(id) {
  return prisma.supplier.findUnique({ where: { id } });
}

function findByEmail(email) {
  return prisma.supplier.findUnique({ where: { email } });
}

function create(data) {
  return prisma.supplier.create({ data });
}

function update(id, data) {
  return prisma.supplier.update({ where: { id }, data });
}

module.exports = { list, findById, findByEmail, create, update };
