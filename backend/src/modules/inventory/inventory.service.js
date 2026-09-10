const prisma = require("../../config/db");
const inventoryRepository = require("../../repositories/inventory.repository");
const warehouseRepository = require("../../repositories/warehouse.repository");
const stockAdjustmentRepository = require("../../repositories/stockAdjustment.repository");
const stockMovement = require("../../services/stockMovement.service");
const HttpError = require("../../utils/httpError");
const { ADMIN_ROLES } = require("../../config/constants");

async function resolveWarehouseScope(user, requestedWarehouseId) {
  if (ADMIN_ROLES.includes(user.role)) {
    return requestedWarehouseId ? [requestedWarehouseId] : undefined;
  }

  const assignedIds = await warehouseRepository.listWarehouseIdsForUser(user.id);

  if (requestedWarehouseId) {
    if (!assignedIds.includes(requestedWarehouseId)) {
      throw new HttpError(403, "You do not have access to this warehouse");
    }
    return [requestedWarehouseId];
  }

  return assignedIds;
}

async function getStock(user, query) {
  const requestedWarehouseId = query.warehouseId ? Number(query.warehouseId) : undefined;
  const scopeIds = await resolveWarehouseScope(user, requestedWarehouseId);

  if (scopeIds && scopeIds.length === 0) {
    return [];
  }

  const results = await Promise.all(
    (scopeIds || [undefined]).map((warehouseId) =>
      inventoryRepository.listStock({
        warehouseId,
        productId: query.productId ? Number(query.productId) : undefined,
        lowStockOnly: query.lowStockOnly === "true",
      })
    )
  );

  return results.flat();
}

async function getTransactions(user, query) {
  const requestedWarehouseId = query.warehouseId ? Number(query.warehouseId) : undefined;
  const scopeIds = await resolveWarehouseScope(user, requestedWarehouseId);

  if (scopeIds && scopeIds.length === 0) {
    return { items: [], total: 0, page: 1, limit: 20 };
  }

  if (scopeIds && scopeIds.length > 1) {
    // Non-admin user with multiple assigned warehouses and no specific filter:
    // query each and merge, since the repository filters by a single warehouseId.
    const pages = await Promise.all(
      scopeIds.map((warehouseId) =>
        inventoryRepository.listTransactions({
          warehouseId,
          productId: query.productId ? Number(query.productId) : undefined,
          type: query.type,
          from: query.from,
          to: query.to,
          page: 1,
          limit: 1000,
        })
      )
    );
    const merged = pages.flatMap((p) => p.items).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { items: merged, total: merged.length, page: 1, limit: merged.length };
  }

  return inventoryRepository.listTransactions({
    warehouseId: scopeIds ? scopeIds[0] : undefined,
    productId: query.productId ? Number(query.productId) : undefined,
    type: query.type,
    from: query.from,
    to: query.to,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 20,
  });
}

async function createAdjustment(user, data) {
  const warehouseId = Number(data.warehouseId);
  const productId = Number(data.productId);
  const quantityChange = Number(data.quantityChange);

  if (!ADMIN_ROLES.includes(user.role)) {
    const assignedIds = await warehouseRepository.listWarehouseIdsForUser(user.id);
    if (!assignedIds.includes(warehouseId)) {
      throw new HttpError(403, "You do not have access to this warehouse");
    }
  }

  return prisma.$transaction(async (tx) => {
    const adjustment = await stockAdjustmentRepository.create(
      {
        productId,
        warehouseId,
        quantityChange,
        reason: data.reason,
        notes: data.notes || null,
        performedById: user.id,
      },
      tx
    );

    if (quantityChange > 0) {
      await stockMovement.increaseStock(tx, {
        productId,
        warehouseId,
        quantity: quantityChange,
        type: "ADJUSTMENT",
        referenceType: "StockAdjustment",
        referenceId: adjustment.id,
        performedById: user.id,
      });
    } else {
      await stockMovement.decreaseStock(tx, {
        productId,
        warehouseId,
        quantity: Math.abs(quantityChange),
        type: "ADJUSTMENT",
        referenceType: "StockAdjustment",
        referenceId: adjustment.id,
        performedById: user.id,
      });
    }

    return adjustment;
  });
}

async function getAdjustments(user, query) {
  const requestedWarehouseId = query.warehouseId ? Number(query.warehouseId) : undefined;
  const scopeIds = await resolveWarehouseScope(user, requestedWarehouseId);

  if (scopeIds && scopeIds.length === 0) {
    return { items: [], total: 0, page: 1, limit: 20 };
  }

  if (scopeIds && scopeIds.length > 1) {
    const pages = await Promise.all(
      scopeIds.map((warehouseId) =>
        stockAdjustmentRepository.list({
          warehouseId,
          productId: query.productId ? Number(query.productId) : undefined,
          page: 1,
          limit: 1000,
        })
      )
    );
    const merged = pages.flatMap((p) => p.items).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { items: merged, total: merged.length, page: 1, limit: merged.length };
  }

  return stockAdjustmentRepository.list({
    warehouseId: scopeIds ? scopeIds[0] : undefined,
    productId: query.productId ? Number(query.productId) : undefined,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 20,
  });
}

module.exports = { getStock, getTransactions, createAdjustment, getAdjustments };
