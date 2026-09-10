const prisma = require("../../config/db");
const transferRepository = require("../../repositories/stockTransfer.repository");
const stockMovement = require("../../services/stockMovement.service");
const notificationService = require("../../services/notification.service");
const HttpError = require("../../utils/httpError");

async function list(query) {
  return transferRepository.list({
    status: query.status,
    warehouseId: query.warehouseId ? Number(query.warehouseId) : undefined,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 20,
  });
}

async function getById(id) {
  const transfer = await transferRepository.findById(id);
  if (!transfer) throw new HttpError(404, "Stock transfer not found");
  return transfer;
}

async function create(data, requestedById) {
  if (data.sourceWarehouseId === data.destinationWarehouseId) {
    throw new HttpError(400, "Source and destination warehouse must be different");
  }
  return transferRepository.create({ ...data, requestedById });
}

async function cancel(id) {
  const transfer = await transferRepository.findById(id);
  if (!transfer) throw new HttpError(404, "Stock transfer not found");
  if (transfer.status !== "PENDING") {
    throw new HttpError(400, "Only PENDING transfers can be cancelled");
  }
  return transferRepository.updateStatus(id, "CANCELLED");
}

async function complete(id, performedById) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.stockTransfer.findUnique({ where: { id }, include: { items: true } });

    if (!transfer) throw new HttpError(404, "Stock transfer not found");
    if (transfer.status !== "PENDING") {
      throw new HttpError(400, "Only PENDING transfers can be completed");
    }

    for (const item of transfer.items) {
      await stockMovement.decreaseStock(tx, {
        productId: item.productId,
        warehouseId: transfer.sourceWarehouseId,
        quantity: item.quantity,
        type: "TRANSFER_OUT",
        referenceType: "StockTransfer",
        referenceId: transfer.id,
        performedById,
      });

      await stockMovement.increaseStock(tx, {
        productId: item.productId,
        warehouseId: transfer.destinationWarehouseId,
        quantity: item.quantity,
        type: "TRANSFER_IN",
        referenceType: "StockTransfer",
        referenceId: transfer.id,
        performedById,
      });
    }

    await tx.stockTransfer.update({ where: { id }, data: { status: "COMPLETED" } });

    await notificationService.notifyRole(
      tx,
      "WAREHOUSE_MANAGER",
      "TRANSFER_COMPLETED",
      `Stock transfer #${transfer.id} completed: ${transfer.sourceWarehouseId} → ${transfer.destinationWarehouseId}`,
      "StockTransfer",
      transfer.id
    );

    return tx.stockTransfer.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
      },
    });
  });
}

module.exports = { list, getById, create, cancel, complete };
