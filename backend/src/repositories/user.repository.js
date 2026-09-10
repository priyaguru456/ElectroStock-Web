const prisma = require("../config/db");

function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function list({ role, roleIn, status, search, page = 1, limit = 20 }) {
  const where = {};
  if (roleIn) where.role = { in: roleIn };
  else if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, limit };
}

function create(data) {
  return prisma.user.create({ data });
}

function update(id, data) {
  return prisma.user.update({ where: { id }, data });
}

function countByRoleAndStatus(role, status) {
  return prisma.user.count({ where: { role, status } });
}

module.exports = { findByEmail, findById, list, create, update, countByRoleAndStatus };
