const prisma = require("../../config/db");
const warehouseRepository = require("../../repositories/warehouse.repository");
const { ADMIN_ROLES, EMPLOYEE_VIEWING_ROLES, MANAGED_ROLES_BY_MANAGER } = require("../../config/constants");

async function resolveWarehouseIds(user) {
  if (ADMIN_ROLES.includes(user.role)) return undefined;
  return warehouseRepository.listWarehouseIdsForUser(user.id);
}

async function getSummary(user) {
  const warehouseIds = await resolveWarehouseIds(user);
  const warehouseWhere = warehouseIds ? { warehouseId: { in: warehouseIds } } : {};

  const [
    totalProducts,
    totalWarehouses,
    stockRows,
    pendingPurchases,
    pendingSales,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    ADMIN_ROLES.includes(user.role) ? prisma.warehouse.count({ where: { isActive: true } }) : Promise.resolve(warehouseIds.length),
    prisma.inventory.findMany({
      where: warehouseWhere,
      include: { product: { select: { reorderLevel: true } } },
    }),
    prisma.purchaseOrder.count({ where: { status: { in: ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED"] } } }),
    prisma.salesOrder.count({
      where: {
        status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] },
        ...(warehouseIds ? { warehouseId: { in: warehouseIds } } : {}),
      },
    }),
  ]);

  const totalStock = stockRows.reduce((sum, row) => sum + row.quantity, 0);
  const lowStockCount = stockRows.filter((row) => row.quantity < row.product.reorderLevel).length;

  return {
    totalProducts,
    totalWarehouses,
    totalStock,
    lowStockCount,
    pendingPurchases,
    pendingSales,
  };
}

async function getTopSellingProducts(user, limit = 5) {
  const warehouseIds = await resolveWarehouseIds(user);

  const grouped = await prisma.salesOrderItem.groupBy({
    by: ["productId"],
    where: {
      salesOrder: {
        // Only orders that actually took stock (PENDING hasn't yet; CANCELLED reversed it)
        status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
        ...(warehouseIds ? { warehouseId: { in: warehouseIds } } : {}),
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const products = await prisma.product.findMany({
    where: { id: { in: grouped.map((g) => g.productId) } },
    select: { id: true, sku: true, name: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return grouped.map((g) => ({
    product: productMap.get(g.productId),
    quantitySold: g._sum.quantity || 0,
  }));
}

async function getEmployeeDashboard(user) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [profile, attendanceToday, taskCounts] = await Promise.all([
    prisma.employeeProfile.findUnique({
      where: { userId: user.id },
      include: { shift: true, department: true },
    }),
    prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: user.id, date: today } },
    }),
    prisma.warehouseTask.groupBy({
      by: ["status"],
      where: { assignedToId: user.id },
      _count: { _all: true },
    }),
  ]);

  return {
    shift: profile?.shift || null,
    department: profile?.department || null,
    attendanceToday,
    taskCounts: taskCounts.reduce((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {}),
  };
}

async function getManagerDashboard(user) {
  if (!EMPLOYEE_VIEWING_ROLES.includes(user.role)) {
    return null;
  }

  const managedRoles = MANAGED_ROLES_BY_MANAGER[user.role];
  const teamWhere = managedRoles ? { role: { in: managedRoles } } : {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalEmployees, presentToday, teamUserIds, taskCounts] = await Promise.all([
    prisma.user.count({ where: teamWhere }),
    prisma.attendance.count({
      where: {
        date: today,
        status: { in: ["PRESENT", "LATE"] },
        employee: teamWhere,
      },
    }),
    prisma.user.findMany({ where: teamWhere, select: { id: true } }),
    prisma.warehouseTask.groupBy({
      by: ["status"],
      where: { assignedTo: teamWhere },
      _count: { _all: true },
    }),
  ]);

  const shiftGroups = await prisma.employeeProfile.groupBy({
    by: ["shiftId"],
    where: { userId: { in: teamUserIds.map((u) => u.id) } },
    _count: { _all: true },
  });
  const shifts = await prisma.shift.findMany({
    where: { id: { in: shiftGroups.map((g) => g.shiftId).filter((id) => id != null) } },
    select: { id: true, name: true },
  });
  const shiftNameById = new Map(shifts.map((s) => [s.id, s.name]));

  return {
    totalEmployees,
    presentToday,
    absentToday: totalEmployees - presentToday,
    shiftDistribution: shiftGroups.map((g) => ({
      shiftId: g.shiftId,
      shiftName: g.shiftId != null ? shiftNameById.get(g.shiftId) || "Unknown" : "Unassigned",
      count: g._count._all,
    })),
    taskCounts: taskCounts.reduce((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {}),
  };
}

module.exports = { getSummary, getTopSellingProducts, getEmployeeDashboard, getManagerDashboard };
