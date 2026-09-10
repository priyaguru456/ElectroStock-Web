const prisma = require("../config/db");

async function list({ categoryId, supplierId, isActive, search, page = 1, limit = 20 }) {
  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (supplierId) where.defaultSupplierId = supplierId;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [{ name: { contains: search } }, { sku: { contains: search } }];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { category: { select: { id: true, name: true } }, defaultSupplier: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, limit };
}

function findById(id) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      defaultSupplier: { select: { id: true, name: true } },
      inventory: { include: { warehouse: { select: { id: true, name: true } } } },
    },
  });
}

function findBySku(sku) {
  return prisma.product.findUnique({ where: { sku } });
}

function create(data) {
  return prisma.product.create({ data });
}

function update(id, data) {
  return prisma.product.update({ where: { id }, data });
}

module.exports = { list, findById, findBySku, create, update };
