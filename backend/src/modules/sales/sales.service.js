const prisma = require("../../config/db");
const salesOrderRepository = require("../../repositories/salesOrder.repository");
const stockMovement = require("../../services/stockMovement.service");
const notificationService = require("../../services/notification.service");
const { logAudit } = require("../../utils/auditLogger");
const HttpError = require("../../utils/httpError");

const FORWARD_TRANSITIONS = {
  CONFIRMED: ["PROCESSING"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
};

const STOCK_TAKEN_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED"];

async function list(query) {
  return salesOrderRepository.list({
    status: query.status,
    customerId: query.customerId ? Number(query.customerId) : undefined,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 20,
  });
}

async function getById(id) {
  const order = await salesOrderRepository.findById(id);
  if (!order) throw new HttpError(404, "Sales order not found");
  return order;
}

async function create(data, createdById) {
  const order = await salesOrderRepository.create({ ...data, createdById });
  await notificationService.notifyRole(
    prisma,
    "SALES_MANAGER",
    "NEW_SALES_ORDER",
    `New sales order #${order.id} for ${order.customer.name}`,
    "SalesOrder",
    order.id
  );
  return order;
}

async function update(id, data) {
  const order = await salesOrderRepository.findById(id);
  if (!order) throw new HttpError(404, "Sales order not found");
  if (order.status !== "PENDING") {
    throw new HttpError(400, "Only PENDING sales orders can be edited");
  }
  return salesOrderRepository.replaceItems(id, data.items);
}

async function confirm(id, performedById) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.salesOrder.findUnique({ where: { id }, include: { items: true } });

    if (!order) throw new HttpError(404, "Sales order not found");
    if (order.status !== "PENDING") {
      throw new HttpError(400, "Only PENDING sales orders can be confirmed");
    }

    // Every line is checked and decremented inside this same transaction — if any line
    // has insufficient stock, decreaseStock throws and the whole transaction rolls back,
    // so a sale never partially takes stock.
    for (const item of order.items) {
      await stockMovement.decreaseStock(tx, {
        productId: item.productId,
        warehouseId: order.warehouseId,
        quantity: item.quantity,
        type: "SALE_OUT",
        referenceType: "SalesOrder",
        referenceId: order.id,
        performedById,
      });
    }

    await tx.salesOrder.update({ where: { id }, data: { status: "CONFIRMED" } });

    return tx.salesOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
        customer: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });
  });
}

async function advanceStatus(id, nextStatus) {
  const order = await salesOrderRepository.findById(id);
  if (!order) throw new HttpError(404, "Sales order not found");

  const allowed = FORWARD_TRANSITIONS[order.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw new HttpError(400, `Cannot move a ${order.status} order to ${nextStatus}`);
  }

  return salesOrderRepository.updateStatus(id, nextStatus);
}

async function cancel(id, performedById) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.salesOrder.findUnique({ where: { id }, include: { items: true } });

    if (!order) throw new HttpError(404, "Sales order not found");
    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      throw new HttpError(400, `A ${order.status} order cannot be cancelled`);
    }

    if (STOCK_TAKEN_STATUSES.includes(order.status)) {
      for (const item of order.items) {
        await stockMovement.increaseStock(tx, {
          productId: item.productId,
          warehouseId: order.warehouseId,
          quantity: item.quantity,
          type: "SALE_CANCELLED",
          referenceType: "SalesOrder",
          referenceId: order.id,
          performedById,
        });
      }
    }

    const updated = await tx.salesOrder.update({ where: { id }, data: { status: "CANCELLED" } });

    await logAudit(tx, {
      userId: performedById,
      action: "STATUS_CHANGE",
      entityType: "SalesOrder",
      entityId: id,
      oldValue: { status: order.status },
      newValue: { status: "CANCELLED" },
    });

    return updated;
  });
}

module.exports = { list, getById, create, update, confirm, advanceStatus, cancel };
