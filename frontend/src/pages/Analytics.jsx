import { useEffect, useState } from "react";
import apiClient from "../api/client";

function groupCount(list, key) {
  const map = {};
  for (const item of list) {
    const k = item[key] || "UNKNOWN";
    map[k] = (map[k] || 0) + 1;
  }
  return map;
}

function DonutChart({ data, size = 140 }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  const colors = ["var(--accent)", "var(--accent-2)", "#22c55e", "#a855f7", "#ef4444", "#eab308"];

  if (total === 0) {
    return <div className="empty-state">No data.</div>;
  }

  let cursor = 0;
  const stops = entries.map(([label, value], i) => {
    const start = (cursor / total) * 360;
    cursor += value;
    const end = (cursor / total) * 360;
    return `${colors[i % colors.length]} ${start}deg ${end}deg`;
  });

  return (
    <div className="donut-wrap">
      <div
        className="donut-chart"
        style={{ width: size, height: size, background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="donut-hole">
          <span className="donut-total">{total}</span>
        </div>
      </div>
      <ul className="donut-legend">
        {entries.map(([label, value], i) => (
          <li key={label}>
            <span className="legend-dot" style={{ background: colors[i % colors.length] }} />
            {label} <strong>{value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarList({ data, max }) {
  const entries = Object.entries(data);
  const maxVal = max || Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="bar-list">
      {entries.map(([label, value]) => (
        <div className="bar-row" key={label}>
          <span className="bar-label">{label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(value / maxVal) * 100}%` }} />
          </div>
          <span className="bar-value">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState(null);
  const [purchases, setPurchases] = useState(null);
  const [movements, setMovements] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [employeePerf, setEmployeePerf] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [s, sl, p, mv, ls, ep] = await Promise.all([
          apiClient.get("/dashboard/summary"),
          apiClient.get("/reports/sales"),
          apiClient.get("/reports/purchases"),
          apiClient.get("/reports/stock-movement"),
          apiClient.get("/reports/low-stock"),
          apiClient.get("/reports/employee-performance"),
        ]);
        setSummary(s.data.data);
        setSales(sl.data.data);
        setPurchases(p.data.data);
        setMovements(mv.data.data);
        setLowStock(ls.data.data);
        setEmployeePerf(ep.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading analytics…</p>;

  const salesByStatus = sales ? groupCount(sales.orders, "status") : {};
  const purchasesByStatus = purchases ? groupCount(purchases.orders, "status") : {};
  const movementsByType = groupCount(movements, "type");
  const topEmployees = [...employeePerf]
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
    .slice(0, 6)
    .reduce((acc, e) => {
      acc[e.employee?.name || "Unknown"] = e.tasksCompleted;
      return acc;
    }, {});

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">₹{Number(sales?.totalRevenue || 0).toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{Number(purchases?.totalSpend || 0).toLocaleString()}</div>
          <div className="stat-label">Total Spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{sales?.orderCount || 0}</div>
          <div className="stat-label">Sales Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{purchases?.orderCount || 0}</div>
          <div className="stat-label">Purchase Orders</div>
        </div>
        <div className={`stat-card${lowStock.length > 0 ? " stat-card-warn" : ""}`}>
          <div className="stat-value">{lowStock.length}</div>
          <div className="stat-label">Low Stock Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary?.totalStock ?? "-"}</div>
          <div className="stat-label">Total Stock On Hand</div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Sales Orders by Status</h3>
          <DonutChart data={salesByStatus} />
        </div>

        <div className="analytics-card">
          <h3>Purchase Orders by Status</h3>
          <DonutChart data={purchasesByStatus} />
        </div>

        <div className="analytics-card">
          <h3>Stock Movements by Type</h3>
          <BarList data={movementsByType} />
        </div>

        <div className="analytics-card">
          <h3>Top Employees (Tasks Completed)</h3>
          {Object.keys(topEmployees).length === 0 ? (
            <p className="empty-state">No task data yet.</p>
          ) : (
            <BarList data={topEmployees} />
          )}
        </div>
      </div>
    </div>
  );
}
