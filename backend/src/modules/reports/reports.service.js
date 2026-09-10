const prisma = require("../../config/db");

async function inventoryReport({ warehouseId, categoryId, lowStockOnly }) {
  const where = {};
  if (warehouseId) where.warehouseId = warehouseId;
  if (categoryId) where.product = { categoryId };

  const rows = await prisma.inventory.findMany({
    where,
    include: {
      product: { select: { id: true, sku: true, name: true, reorderLevel: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
    },
    orderBy: [{ warehouse: { name: "asc" } }, { product: { name: "asc" } }],
  });

  const withFlag = rows.map((r) => ({ ...r, isLowStock: r.quantity < r.product.reorderLevel }));
  return lowStockOnly ? withFlag.filter((r) => r.isLowStock) : withFlag;
}

async function lowStockReport({ warehouseId }) {
  return inventoryReport({ warehouseId, lowStockOnly: true });
}

async function salesReport({ from, to, customerId, warehouseId }) {
  const where = {};
  if (customerId) where.customerId = customerId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (from || to) {
    where.orderDate = {};
    if (from) where.orderDate.gte = new Date(from);
    if (to) where.orderDate.lte = new Date(to);
  }

  const orders = await prisma.salesOrder.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true } },
      warehouse: { select: { id: true, name: true } },
      items: true,
    },
    orderBy: { orderDate: "desc" },
  });

  // Only orders that actually took stock count as realized revenue (PENDING hasn't yet).
  const totalRevenue = orders
    .filter((o) => ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return { orders, totalRevenue, orderCount: orders.length };
}

async function purchaseReport({ from, to, supplierId, warehouseId }) {
  const where = {};
  if (supplierId) where.supplierId = supplierId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true } },
      warehouse: { select: { id: true, name: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Committed spend once a PO has actually been sent to the supplier (DRAFT hasn't committed
  // yet; CANCELLED never will).
  const totalSpend = orders
    .filter((o) => ["ORDERED", "PARTIALLY_RECEIVED", "RECEIVED"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return { orders, totalSpend, orderCount: orders.length };
}

async function stockMovementReport({ productId, warehouseId, from, to }) {
  const where = {};
  if (productId) where.productId = productId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  return prisma.inventoryTransaction.findMany({
    where,
    include: {
      product: { select: { id: true, sku: true, name: true } },
      warehouse: { select: { id: true, name: true } },
      performedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

async function employeePerformanceReport({ employeeId, from, to }) {
  const taskWhere = {};
  if (employeeId) taskWhere.assignedToId = employeeId;
  if (from || to) {
    taskWhere.createdAt = {};
    if (from) taskWhere.createdAt.gte = new Date(from);
    if (to) taskWhere.createdAt.lte = new Date(to);
  }

  const attendanceWhere = {};
  if (employeeId) attendanceWhere.employeeId = employeeId;
  if (from || to) {
    attendanceWhere.date = {};
    if (from) attendanceWhere.date.gte = new Date(from);
    if (to) attendanceWhere.date.lte = new Date(to);
  }

  const [tasksByEmployee, tasksByType, attendanceByEmployee] = await Promise.all([
    prisma.warehouseTask.groupBy({
      by: ["assignedToId", "status"],
      where: { ...taskWhere, assignedToId: employeeId ? employeeId : { not: null } },
      _count: { _all: true },
    }),
    prisma.warehouseTask.groupBy({
      by: ["assignedToId", "type", "status"],
      where: { ...taskWhere, assignedToId: employeeId ? employeeId : { not: null }, status: "COMPLETED" },
      _count: { _all: true },
    }),
    prisma.attendance.groupBy({
      by: ["employeeId", "status"],
      where: attendanceWhere,
      _count: { _all: true },
    }),
  ]);

  const employeeIds = [
    ...new Set([
      ...tasksByEmployee.map((r) => r.assignedToId),
      ...attendanceByEmployee.map((r) => r.employeeId),
    ]),
  ];

  const employees = await prisma.user.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, name: true, email: true },
  });
  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const byEmployee = employeeIds.map((id) => {
    const taskRows = tasksByEmployee.filter((r) => r.assignedToId === id);
    const typeRows = tasksByType.filter((r) => r.assignedToId === id);
    const attendanceRows = attendanceByEmployee.filter((r) => r.employeeId === id);

    const tasksCompleted = taskRows.find((r) => r.status === "COMPLETED")?._count._all || 0;
    const tasksPending = taskRows
      .filter((r) => ["PENDING", "ASSIGNED", "IN_PROGRESS"].includes(r.status))
      .reduce((sum, r) => sum + r._count._all, 0);
    const totalAttendance = attendanceRows.reduce((sum, r) => sum + r._count._all, 0);
    const presentAttendance = attendanceRows
      .filter((r) => ["PRESENT", "LATE", "HALF_DAY"].includes(r.status))
      .reduce((sum, r) => sum + r._count._all, 0);

    return {
      employee: employeeMap.get(id),
      tasksCompleted,
      tasksPending,
      tasksByType: typeRows.reduce((acc, r) => {
        acc[r.type] = r._count._all;
        return acc;
      }, {}),
      attendancePercentage: totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : null,
    };
  });

  return byEmployee;
}

module.exports = {
  inventoryReport,
  lowStockReport,
  salesReport,
  purchaseReport,
  stockMovementReport,
  employeePerformanceReport,
};
