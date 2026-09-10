const prisma = require("../config/db");

function create(data, client = prisma) {
  return client.stockAdjustment.create({ data });
}

async function list({ productId, warehouseId, page = 1, limit = 20 }) {
  const where = {};
  if (productId) where.productId = productId;
  if (warehouseId) where.warehouseId = warehouseId;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, sku: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        performedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  return { items, total, page, limit };
}

module.exports = { create, list };
