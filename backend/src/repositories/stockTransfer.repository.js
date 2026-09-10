const prisma = require("../config/db");

const detailInclude = {
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
  sourceWarehouse: { select: { id: true, name: true } },
  destinationWarehouse: { select: { id: true, name: true } },
  requestedBy: { select: { id: true, name: true } },
};

async function list({ status, warehouseId, page = 1, limit = 20 }) {
  const where = {};
  if (status) where.status = status;
  if (warehouseId) {
    where.OR = [{ sourceWarehouseId: warehouseId }, { destinationWarehouseId: warehouseId }];
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.stockTransfer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
      },
    }),
    prisma.stockTransfer.count({ where }),
  ]);

  return { items, total, page, limit };
}

function findById(id, client = prisma) {
  return client.stockTransfer.findUnique({ where: { id }, include: detailInclude });
}

function create({ sourceWarehouseId, destinationWarehouseId, requestedById, items }) {
  return prisma.stockTransfer.create({
    data: {
      sourceWarehouseId,
      destinationWarehouseId,
      requestedById,
      items: {
        create: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      },
    },
    include: detailInclude,
  });
}

function updateStatus(id, status, client = prisma) {
  return client.stockTransfer.update({ where: { id }, data: { status } });
}

module.exports = { list, findById, create, updateStatus };
