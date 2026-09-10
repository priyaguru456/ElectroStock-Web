const prisma = require("../config/db");

// SUPER_ADMIN should see everything an ADMIN-targeted broadcast would show, since it's a
// strict superset role — without this, "role: ADMIN" notifications never reach SUPER_ADMIN.
function rolesVisibleTo(userRole) {
  return userRole === "SUPER_ADMIN" ? ["SUPER_ADMIN", "ADMIN"] : [userRole];
}

function create(data, client = prisma) {
  return client.notification.create({ data });
}

async function listForUser(userId, userRole, { isRead, page = 1, limit = 20 } = {}) {
  const where = { OR: [{ userId }, { userId: null, role: { in: rolesVisibleTo(userRole) } }] };
  if (isRead !== undefined) where.isRead = isRead;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.notification.count({ where }),
  ]);

  return { items, total, page, limit };
}

function markRead(id, userId, userRole) {
  return prisma.notification.updateMany({
    where: { id, OR: [{ userId }, { userId: null, role: { in: rolesVisibleTo(userRole) } }] },
    data: { isRead: true },
  });
}

function markAllRead(userId, userRole) {
  return prisma.notification.updateMany({
    where: { OR: [{ userId }, { userId: null, role: { in: rolesVisibleTo(userRole) } }] },
    data: { isRead: true },
  });
}

module.exports = { create, listForUser, markRead, markAllRead };
