const HttpError = require("../utils/httpError");
const notificationService = require("./notification.service");

// Shared by Purchases (receive), Sales (confirm/cancel), Transfers, and Stock Adjustments.
// Every stock-changing operation must go through one of these, inside a prisma.$transaction,
// so the inventory row update and its audit trail row are always written together or not at all.

async function increaseStock(tx, { productId, warehouseId, quantity, type, referenceType, referenceId, performedById }) {
  if (quantity <= 0) {
    throw new HttpError(400, "Quantity to increase must be greater than zero");
  }

  const existing = await tx.inventory.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  });

  const quantityBefore = existing ? existing.quantity : 0;
  const quantityAfter = quantityBefore + quantity;

  await tx.inventory.upsert({
    where: { productId_warehouseId: { productId, warehouseId } },
    create: { productId, warehouseId, quantity },
    update: { quantity: { increment: quantity } },
  });

  return tx.inventoryTransaction.create({
    data: {
      productId,
      warehouseId,
      type,
      quantityChange: quantity,
      quantityBefore,
      quantityAfter,
      referenceType,
      referenceId,
      performedById,
    },
  });
}

async function decreaseStock(tx, { productId, warehouseId, quantity, type, referenceType, referenceId, performedById }) {
  if (quantity <= 0) {
    throw new HttpError(400, "Quantity to decrease must be greater than zero");
  }

  const existing = await tx.inventory.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  });
  const quantityBefore = existing ? existing.quantity : 0;

  // Atomic conditional update: only succeeds if enough stock is still there at write time,
  // closing the read-then-write race between the earlier check and this write.
  const result = await tx.inventory.updateMany({
    where: { productId, warehouseId, quantity: { gte: quantity } },
    data: { quantity: { decrement: quantity } },
  });

  if (result.count === 0) {
    throw new HttpError(400, `Insufficient stock for product ${productId} at warehouse ${warehouseId}`);
  }

  const quantityAfter = quantityBefore - quantity;

  const transaction = await tx.inventoryTransaction.create({
    data: {
      productId,
      warehouseId,
      type,
      quantityChange: -quantity,
      quantityBefore,
      quantityAfter,
      referenceType,
      referenceId,
      performedById,
    },
  });

  const [product, warehouse] = await Promise.all([
    tx.product.findUnique({ where: { id: productId }, select: { sku: true, name: true, reorderLevel: true } }),
    tx.warehouse.findUnique({ where: { id: warehouseId }, select: { name: true } }),
  ]);

  await notificationService.notifyLowStockIfCrossed(tx, {
    reorderLevel: product.reorderLevel,
    quantityBefore,
    quantityAfter,
    productSku: product.sku,
    productName: product.name,
    warehouseName: warehouse.name,
    warehouseId,
  });

  return transaction;
}

module.exports = { increaseStock, decreaseStock };
