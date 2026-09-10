const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const usersRoutes = require("../modules/users/users.routes");
const categoriesRoutes = require("../modules/categories/categories.routes");
const suppliersRoutes = require("../modules/suppliers/suppliers.routes");
const warehousesRoutes = require("../modules/warehouses/warehouses.routes");
const productsRoutes = require("../modules/products/products.routes");
const inventoryRoutes = require("../modules/inventory/inventory.routes");
const purchasesRoutes = require("../modules/purchases/purchases.routes");
const transfersRoutes = require("../modules/transfers/transfers.routes");
const customersRoutes = require("../modules/customers/customers.routes");
const salesRoutes = require("../modules/sales/sales.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const reportsRoutes = require("../modules/reports/reports.routes");
const notificationsRoutes = require("../modules/notifications/notifications.routes");
const auditRoutes = require("../modules/audit/audit.routes");
const employeesRoutes = require("../modules/employees/employees.routes");
const departmentsRoutes = require("../modules/departments/departments.routes");
const shiftsRoutes = require("../modules/shifts/shifts.routes");
const attendanceRoutes = require("../modules/attendance/attendance.routes");
const tasksRoutes = require("../modules/tasks/tasks.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/categories", categoriesRoutes);
router.use("/suppliers", suppliersRoutes);
router.use("/warehouses", warehousesRoutes);
router.use("/products", productsRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/purchases", purchasesRoutes);
router.use("/transfers", transfersRoutes);
router.use("/customers", customersRoutes);
router.use("/sales", salesRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/audit", auditRoutes);
router.use("/employees", employeesRoutes);
router.use("/departments", departmentsRoutes);
router.use("/shifts", shiftsRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/tasks", tasksRoutes);

module.exports = router;
