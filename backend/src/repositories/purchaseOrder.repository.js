const prisma = require("../config/db");

const itemsInclude = {
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
  supplier: { select: { id: true, name: true } },
  warehouse: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
};

async function list({ status, supplierId, page = 1, limit = 20 }) {
  const where = {};
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { id: true, name: true } }, warehouse: { select: { id: true, name: true } } },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return { items, total, page, limit };
}

function findById(id, client = prisma) {
  return client.purchaseOrder.findUnique({ where: { id }, include: itemsInclude });
}

function create({ supplierId, warehouseId, createdById, expectedDate, items }) {
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  return prisma.purchaseOrder.create({
    data: {
      supplierId,
      warehouseId,
      createdById,
      expectedDate: expectedDate ? new Date(expectedDate) : undefined,
      totalAmount,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantityOrdered: item.quantity,
          unitCost: item.unitCost,
        })),
      },
    },
    include: itemsInclude,
  });
}

async function replaceItems(id, items) {
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  return prisma.$transaction(async (tx) => {
    await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
    return tx.purchaseOrder.update({
      where: { id },
      data: {
        totalAmount,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantityOrdered: item.quantity,
            unitCost: item.unitCost,
          })),
        },
      },
      include: itemsInclude,
    });
  });
}

function updateStatus(id, status, client = prisma) {
  return client.purchaseOrder.update({ where: { id }, data: { status } });
}

function updateOrderDate(id, client = prisma) {
  return client.purchaseOrder.update({ where: { id }, data: { orderDate: new Date() } });
}

module.exports = { list, findById, create, replaceItems, updateStatus, updateOrderDate };
