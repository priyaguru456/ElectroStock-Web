const service = require("./reports.service");
const { success } = require("../../utils/apiResponse");
const { sendCsv } = require("../../utils/csv");

async function inventory(req, res, next) {
  try {
    const data = await service.inventoryReport({
      warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : undefined,
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      lowStockOnly: req.query.lowStockOnly === "true",
    });

    if (req.query.format === "csv") {
      return sendCsv(res, "inventory-report.csv", data, [
        { label: "SKU", value: (r) => r.product.sku },
        { label: "Product", value: (r) => r.product.name },
        { label: "Warehouse", value: (r) => r.warehouse.name },
        { label: "Quantity", value: (r) => r.quantity },
        { label: "Reorder Level", value: (r) => r.product.reorderLevel },
        { label: "Low Stock", value: (r) => (r.isLowStock ? "Yes" : "No") },
      ]);
    }

    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

async function lowStock(req, res, next) {
  try {
    const data = await service.lowStockReport({
      warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : undefined,
    });

    if (req.query.format === "csv") {
      return sendCsv(res, "low-stock-report.csv", data, [
        { label: "SKU", value: (r) => r.product.sku },
        { label: "Product", value: (r) => r.product.name },
        { label: "Warehouse", value: (r) => r.warehouse.name },
        { label: "Quantity", value: (r) => r.quantity },
        { label: "Reorder Level", value: (r) => r.product.reorderLevel },
      ]);
    }

    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

async function sales(req, res, next) {
  try {
    const data = await service.salesReport({
      from: req.query.from,
      to: req.query.to,
      customerId: req.query.customerId ? Number(req.query.customerId) : undefined,
      warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : undefined,
    });

    if (req.query.format === "csv") {
      return sendCsv(res, "sales-report.csv", data.orders, [
        { label: "Order #", value: (o) => o.id },
        { label: "Customer", value: (o) => o.customer.name },
        { label: "Warehouse", value: (o) => o.warehouse.name },
        { label: "Status", value: (o) => o.status },
        { label: "Order Date", value: (o) => o.orderDate.toISOString() },
        { label: "Total", value: (o) => o.totalAmount },
      ]);
    }

    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

async function purchases(req, res, next) {
  try {
    const data = await service.purchaseReport({
      from: req.query.from,
      to: req.query.to,
      supplierId: req.query.supplierId ? Number(req.query.supplierId) : undefined,
      warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : undefined,
    });

    if (req.query.format === "csv") {
      return sendCsv(res, "purchase-report.csv", data.orders, [
        { label: "Order #", value: (o) => o.id },
        { label: "Supplier", value: (o) => o.supplier.name },
        { label: "Warehouse", value: (o) => o.warehouse.name },
        { label: "Status", value: (o) => o.status },
        { label: "Created", value: (o) => o.createdAt.toISOString() },
        { label: "Total", value: (o) => o.totalAmount },
      ]);
    }

    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

async function stockMovement(req, res, next) {
  try {
    const data = await service.stockMovementReport({
      productId: req.query.productId ? Number(req.query.productId) : undefined,
      warehouseId: req.query.warehouseId ? Number(req.query.warehouseId) : undefined,
      from: req.query.from,
      to: req.query.to,
    });

    if (req.query.format === "csv") {
      return sendCsv(res, "stock-movement-report.csv", data, [
        { label: "Date", value: (t) => t.createdAt.toISOString() },
        { label: "SKU", value: (t) => t.product.sku },
        { label: "Warehouse", value: (t) => t.warehouse.name },
        { label: "Type", value: (t) => t.type },
        { label: "Change", value: (t) => t.quantityChange },
        { label: "Before", value: (t) => t.quantityBefore },
        { label: "After", value: (t) => t.quantityAfter },
        { label: "By", value: (t) => t.performedBy?.name || "" },
      ]);
    }

    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

async function employeePerformance(req, res, next) {
  try {
    const data = await service.employeePerformanceReport({
      employeeId: req.query.employeeId ? Number(req.query.employeeId) : undefined,
      from: req.query.from,
      to: req.query.to,
    });

    if (req.query.format === "csv") {
      return sendCsv(res, "employee-performance-report.csv", data, [
        { label: "Employee", value: (r) => r.employee?.name || "" },
        { label: "Email", value: (r) => r.employee?.email || "" },
        { label: "Tasks Completed", value: (r) => r.tasksCompleted },
        { label: "Tasks Pending", value: (r) => r.tasksPending },
        { label: "Attendance %", value: (r) => r.attendancePercentage ?? "" },
      ]);
    }

    return success(res, data);
  } catch (err) {
    return next(err);
  }
}

module.exports = { inventory, lowStock, sales, purchases, stockMovement, employeePerformance };
