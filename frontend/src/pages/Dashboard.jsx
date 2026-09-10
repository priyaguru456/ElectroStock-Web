import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

const EMPLOYEE_VIEWING_ROLES = ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "TEAM_LEADER"];

export default function Dashboard() {
  const { user } = useAuth();
  const isManager = EMPLOYEE_VIEWING_ROLES.includes(user?.role);
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [employeeDashboard, setEmployeeDashboard] = useState(null);
  const [managerDashboard, setManagerDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const calls = [
          apiClient.get("/dashboard/summary"),
          apiClient.get("/dashboard/top-products"),
          apiClient.get("/dashboard/employee"),
        ];
        if (isManager) calls.push(apiClient.get("/dashboard/manager"));

        const results = await Promise.all(calls);
        setSummary(results[0].data.data);
        setTopProducts(results[1].data.data);
        setEmployeeDashboard(results[2].data.data);
        if (isManager) setManagerDashboard(results[3].data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = summary
    ? [
        { label: "Total Products", value: summary.totalProducts, icon: "📦" },
        { label: "Total Warehouses", value: summary.totalWarehouses, icon: "🏬" },
        { label: "Total Stock", value: summary.totalStock, icon: "📊" },
        { label: "Low Stock Items", value: summary.lowStockCount, warn: summary.lowStockCount > 0, icon: "⚠️" },
        { label: "Pending Purchases", value: summary.pendingPurchases, icon: "🧾" },
        { label: "Pending Sales", value: summary.pendingSales, icon: "🛒" },
      ]
    : [];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      <p style={{ marginBottom: 20 }}>
        Welcome, {user?.name} ({user?.role}).
      </p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <div className="stat-grid">
            {stats.map((s) => (
              <div key={s.label} className={`stat-card${s.warn ? " stat-card-warn" : ""}`}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {employeeDashboard && (
            <>
              <h2 style={{ marginTop: 32 }}>My Workday</h2>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-value">{employeeDashboard.shift?.name || "No shift"}</div>
                  <div className="stat-label">Current shift</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {employeeDashboard.attendanceToday?.status || "Not checked in"}
                  </div>
                  <div className="stat-label">Today's attendance</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{employeeDashboard.taskCounts?.PENDING || 0}</div>
                  <div className="stat-label">Pending tasks</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{employeeDashboard.taskCounts?.COMPLETED || 0}</div>
                  <div className="stat-label">Completed tasks</div>
                </div>
              </div>
            </>
          )}

          {managerDashboard && (
            <>
              <h2 style={{ marginTop: 32 }}>Team Overview</h2>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-value">{managerDashboard.totalEmployees}</div>
                  <div className="stat-label">Total employees</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{managerDashboard.presentToday}</div>
                  <div className="stat-label">Present today</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{managerDashboard.absentToday}</div>
                  <div className="stat-label">Absent today</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{managerDashboard.taskCounts?.PENDING || 0}</div>
                  <div className="stat-label">Pending team tasks</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{managerDashboard.taskCounts?.COMPLETED || 0}</div>
                  <div className="stat-label">Completed team tasks</div>
                </div>
              </div>

              {managerDashboard.shiftDistribution?.length > 0 && (
                <table className="data-table" style={{ marginTop: 16 }}>
                  <thead>
                    <tr>
                      <th>Shift</th>
                      <th>Employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerDashboard.shiftDistribution.map((row) => (
                      <tr key={row.shiftId ?? "unassigned"}>
                        <td>{row.shiftName}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          <h2 style={{ marginTop: 32 }}>Top Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="empty-state">No confirmed sales yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Quantity sold</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((row) => (
                  <tr key={row.product.id}>
                    <td>{row.product.sku}</td>
                    <td>{row.product.name}</td>
                    <td>{row.quantitySold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
