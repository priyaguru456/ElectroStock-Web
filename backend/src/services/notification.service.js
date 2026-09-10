const notificationRepository = require("../repositories/notification.repository");

// Cross-cutting helper called from other services after events worth surfacing to users.
// Pass a `client` (a $transaction's tx) when notifying as part of a stock-changing transaction,
// so the notification is only created if the surrounding change actually commits.

function notifyUser(client, userId, type, message, relatedType, relatedId) {
  return notificationRepository.create(
    { userId, role: null, type, message, relatedType, relatedId },
    client
  );
}

function notifyRole(client, role, type, message, relatedType, relatedId) {
  return notificationRepository.create(
    { userId: null, role, type, message, relatedType, relatedId },
    client
  );
}

// Only fires when stock just crossed below reorder level (quantityBefore was >= reorderLevel,
// quantityAfter is below it) — not on every read/write once it's already low, to avoid spam.
async function notifyLowStockIfCrossed(client, { reorderLevel, quantityBefore, quantityAfter, productSku, productName, warehouseName, warehouseId }) {
  const justCrossed = quantityBefore >= reorderLevel && quantityAfter < reorderLevel;
  if (!justCrossed) return;

  await notifyRole(
    client,
    "WAREHOUSE_MANAGER",
    "LOW_STOCK",
    `${productSku} (${productName}) at ${warehouseName} dropped below its reorder level (${quantityAfter}/${reorderLevel})`,
    "Warehouse",
    warehouseId
  );
  await notifyRole(
    client,
    "ADMIN",
    "LOW_STOCK",
    `${productSku} (${productName}) at ${warehouseName} dropped below its reorder level (${quantityAfter}/${reorderLevel})`,
    "Warehouse",
    warehouseId
  );
}

module.exports = { notifyUser, notifyRole, notifyLowStockIfCrossed };
