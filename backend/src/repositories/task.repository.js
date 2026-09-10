const prisma = require("../config/db");

const taskInclude = {
  assignedTo: { select: { id: true, name: true, email: true } },
  assignedBy: { select: { id: true, name: true } },
  warehouse: { select: { id: true, name: true } },
};

async function list({ status, type, priority, assignedToId, warehouseId, page = 1, limit = 20 }) {
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (priority) where.priority = priority;
  if (assignedToId) where.assignedToId = assignedToId;
  if (warehouseId) where.warehouseId = warehouseId;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.warehouseTask.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: taskInclude,
    }),
    prisma.warehouseTask.count({ where }),
  ]);

  return { items, total, page, limit };
}

function findById(id) {
  return prisma.warehouseTask.findUnique({ where: { id }, include: taskInclude });
}

function create(data) {
  return prisma.warehouseTask.create({ data, include: taskInclude });
}

function update(id, data) {
  return prisma.warehouseTask.update({ where: { id }, data, include: taskInclude });
}

module.exports = { list, findById, create, update };
