const prisma = require("../config/db");

function list({ search, isActive } = {}) {
  const where = {};
  if (isActive !== undefined) where.isActive = isActive;
  if (search) where.name = { contains: search };
  return prisma.customer.findMany({ where, orderBy: { name: "asc" } });
}

function findById(id) {
  return prisma.customer.findUnique({ where: { id } });
}

function findByEmail(email) {
  return prisma.customer.findUnique({ where: { email } });
}

function create(data) {
  return prisma.customer.create({ data });
}

function update(id, data) {
  return prisma.customer.update({ where: { id }, data });
}

module.exports = { list, findById, findByEmail, create, update };
