const prisma = require("../config/db");

// Best-effort logging: never let an audit-log failure break the primary operation it's
// recording. For stock/money-affecting changes, prefer passing the surrounding transaction
// as `client` so the log can't silently be skipped if the write actually commits.
async function logAudit(client, { userId, action, entityType, entityId, oldValue, newValue }) {
  try {
    await (client || prisma).auditLog.create({
      data: { userId, action, entityType, entityId, oldValue: oldValue ?? undefined, newValue: newValue ?? undefined },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
  }
}

module.exports = { logAudit };
