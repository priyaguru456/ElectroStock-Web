const prisma = require("../config/db");

const detailInclude = {
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
  customer: { select: { id: true, name: true } },
  warehouse: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
};

async function list({ status, customerId, page = 1, limit = 20 }) {
  const where = {};
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { id: true, name: true } }, warehouse: { select: { id: true, name: true } } },
    }),
    prisma.salesOrder.count({ where }),
  ]);

  return { items, total, page, limit };
}

function findById(id, client = prisma) {
  return client.salesOrder.findUnique({ where: { id }, include: detailInclude });
}

function create({ customerId, warehouseId, createdById, items }) {
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return prisma.salesOrder.create({
    data: {
      customerId,
      warehouseId,
      createdById,
      totalAmount,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: detailInclude,
  });
}

async function replaceItems(id, items) {
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return prisma.$transaction(async (tx) => {
    await tx.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
    return tx.salesOrder.update({
      where: { id },
      data: {
        totalAmount,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: detailInclude,
    });
  });
}

function updateStatus(id, status, client = prisma) {
  return client.salesOrder.update({ where: { id }, data: { status } });
}

module.exports = { list, findById, create, replaceItems, updateStatus };
