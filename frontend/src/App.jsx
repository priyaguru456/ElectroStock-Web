import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Warehouses from "./pages/Warehouses";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import InventoryTransactions from "./pages/InventoryTransactions";
import PurchaseOrders from "./pages/PurchaseOrders";
import StockAdjustments from "./pages/StockAdjustments";
import StockTransfers from "./pages/StockTransfers";
import Customers from "./pages/Customers";
import SalesOrders from "./pages/SalesOrders";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import AuditLogs from "./pages/AuditLogs";
import Employees from "./pages/Employees";
import Departments from "./pages/Departments";
import Shifts from "./pages/Shifts";
import Attendance from "./pages/Attendance";
import Tasks from "./pages/Tasks";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route path="/:role" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="categories" element={<Categories />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="warehouses" element={<Warehouses />} />
              <Route path="products" element={<Products />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="inventory/transactions" element={<InventoryTransactions />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="tasks" element={<Tasks />} />

              <Route element={<ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"]} />}>
                <Route path="purchases" element={<PurchaseOrders />} />
                <Route path="adjustments" element={<StockAdjustments />} />
                <Route path="transfers" element={<StockTransfers />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    roles={["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "SALES_STAFF", "TELECALLER"]}
                  />
                }
              >
                <Route path="customers" element={<Customers />} />
                <Route path="sales" element={<SalesOrders />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    roles={["SUPER_ADMIN", "ADMIN", "SALES_MANAGER", "WAREHOUSE_MANAGER"]}
                  />
                }
              >
                <Route path="users" element={<Users />} />
              </Route>

              <Route element={<ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]} />}>
                <Route path="audit" element={<AuditLogs />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    roles={["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "TEAM_LEADER"]}
                  />
                }
              >
                <Route path="employees" element={<Employees />} />
              </Route>

              <Route element={<ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"]} />}>
                <Route path="departments" element={<Departments />} />
                <Route path="shifts" element={<Shifts />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    roles={["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "SALES_MANAGER", "TEAM_LEADER"]}
                  />
                }
              >
                <Route path="reports" element={<Reports />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
