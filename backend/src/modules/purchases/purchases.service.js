const prisma = require("../../config/db");
const purchaseOrderRepository = require("../../repositories/purchaseOrder.repository");
const stockMovement = require("../../services/stockMovement.service");
const notificationService = require("../../services/notification.service");
const { logAudit } = require("../../utils/auditLogger");
const HttpError = require("../../utils/httpError");

async function list(query) {
  return purchaseOrderRepository.list({
    status: query.status,
    supplierId: query.supplierId ? Number(query.supplierId) : undefined,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 20,
  });
}

async function getById(id) {
  const po = await purchaseOrderRepository.findById(id);
  if (!po) throw new HttpError(404, "Purchase order not found");
  return po;
}

async function create(data, createdById) {
  return purchaseOrderRepository.create({ ...data, createdById });
}

async function update(id, data) {
  const po = await purchaseOrderRepository.findById(id);
  if (!po) throw new HttpError(404, "Purchase order not found");
  if (po.status !== "DRAFT") {
    throw new HttpError(400, "Only DRAFT purchase orders can be edited");
  }
  if (data.items) {
    return purchaseOrderRepository.replaceItems(id, data.items);
  }
  return purchaseOrderRepository.findById(id);
}

async function markOrdered(id) {
  const po = await purchaseOrderRepository.findById(id);
  if (!po) throw new HttpError(404, "Purchase order not found");
  if (po.status !== "DRAFT") {
    throw new HttpError(400, "Only DRAFT purchase orders can be marked as ordered");
  }
  await purchaseOrderRepository.updateOrderDate(id);
  return purchaseOrderRepository.updateStatus(id, "ORDERED");
}

async function cancel(id, performedById) {
  const po = await purchaseOrderRepository.findById(id);
  if (!po) throw new HttpError(404, "Purchase order not found");
  if (!["DRAFT", "ORDERED"].includes(po.status)) {
    throw new HttpError(400, "Only DRAFT or ORDERED purchase orders can be cancelled");
  }
  const updated = await purchaseOrderRepository.updateStatus(id, "CANCELLED");

  await logAudit(null, {
    userId: performedById,
    action: "STATUS_CHANGE",
    entityType: "PurchaseOrder",
    entityId: id,
    oldValue: { status: po.status },
    newValue: { status: "CANCELLED" },
  });

  return updated;
}

async function receive(id, receivedItems, performedById) {
  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!po) throw new HttpError(404, "Purchase order not found");
    if (!["ORDERED", "PARTIALLY_RECEIVED"].includes(po.status)) {
      throw new HttpError(400, "Only ORDERED or PARTIALLY_RECEIVED purchase orders can receive stock");
    }

    const itemsById = new Map(po.items.map((item) => [item.id, item]));

    for (const received of receivedItems) {
      const item = itemsById.get(received.itemId);
      if (!item) {
        throw new HttpError(400, `Purchase order item ${received.itemId} does not belong to this order`);
      }

      const remaining = item.quantityOrdered - item.quantityReceived;
      if (received.quantityReceived > remaining) {
        throw new HttpError(
          400,
          `Cannot receive ${received.quantityReceived} of product ${item.productId} — only ${remaining} remain unreceived`
        );
      }

      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: { quantityReceived: { increment: received.quantityReceived } },
      });

      await stockMovement.increaseStock(tx, {
        productId: item.productId,
        warehouseId: po.warehouseId,
        quantity: received.quantityReceived,
        type: "PURCHASE_IN",
        referenceType: "PurchaseOrder",
        referenceId: po.id,
        performedById,
      });
    }

    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
    const allReceived = updatedItems.every((item) => item.quantityReceived >= item.quantityOrdered);
    const anyReceived = updatedItems.some((item) => item.quantityReceived > 0);

    const newStatus = allReceived ? "RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : po.status;

    await tx.purchaseOrder.update({ where: { id }, data: { status: newStatus } });

    if (newStatus === "RECEIVED") {
      await notificationService.notifyUser(
        tx,
        po.createdById,
        "PURCHASE_RECEIVED",
        `Purchase order #${po.id} has been fully received`,
        "PurchaseOrder",
        po.id
      );
    }

    return tx.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });
  });
}

module.exports = { list, getById, create, update, markOrdered, cancel, receive };
