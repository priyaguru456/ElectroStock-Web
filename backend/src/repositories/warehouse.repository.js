const prisma = require("../config/db");

function list({ search, isActive } = {}) {
  const where = {};
  if (isActive !== undefined) where.isActive = isActive;
  if (search) where.name = { contains: search };
  return prisma.warehouse.findMany({ where, orderBy: { name: "asc" } });
}

function findById(id) {
  return prisma.warehouse.findUnique({
    where: { id },
    include: { staff: { include: { user: { select: { id: true, name: true, email: true, role: true } } } } },
  });
}

function findByName(name) {
  return prisma.warehouse.findUnique({ where: { name } });
}

function create(data) {
  return prisma.warehouse.create({ data });
}

function update(id, data) {
  return prisma.warehouse.update({ where: { id }, data });
}

function countInventory(warehouseId) {
  return prisma.inventory.count({ where: { warehouseId, quantity: { gt: 0 } } });
}

function addStaff(userId, warehouseId) {
  return prisma.warehouseStaff.create({ data: { userId, warehouseId } });
}

function removeStaff(userId, warehouseId) {
  return prisma.warehouseStaff.deleteMany({ where: { userId, warehouseId } });
}

function findStaffAssignment(userId, warehouseId) {
  return prisma.warehouseStaff.findUnique({
    where: { userId_warehouseId: { userId, warehouseId } },
  });
}

async function listWarehouseIdsForUser(userId) {
  const rows = await prisma.warehouseStaff.findMany({
    where: { userId },
    select: { warehouseId: true },
  });
  return rows.map((row) => row.warehouseId);
}

module.exports = {
  list,
  findById,
  findByName,
  create,
  update,
  countInventory,
  addStaff,
  removeStaff,
  findStaffAssignment,
  listWarehouseIdsForUser,
};
