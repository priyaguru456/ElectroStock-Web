const prisma = require("../config/db");

async function listStock({ warehouseId, productId, lowStockOnly }) {
  const where = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (productId) where.productId = productId;

  const rows = await prisma.inventory.findMany({
    where,
    include: {
      product: { select: { id: true, sku: true, name: true, reorderLevel: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
    },
    orderBy: [{ warehouse: { name: "asc" } }, { product: { name: "asc" } }],
  });

  const withLowStockFlag = rows.map((row) => ({
    ...row,
    isLowStock: row.quantity < row.product.reorderLevel,
  }));

  if (lowStockOnly) {
    return withLowStockFlag.filter((row) => row.isLowStock);
  }
  return withLowStockFlag;
}

function findOne(productId, warehouseId) {
  return prisma.inventory.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  });
}

async function listTransactions({ productId, warehouseId, type, from, to, page = 1, limit = 20 }) {
  const where = {};
  if (productId) where.productId = productId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (type) where.type = type;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
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
    prisma.inventoryTransaction.count({ where }),
  ]);

  return { items, total, page, limit };
}

module.exports = { listStock, findOne, listTransactions };
