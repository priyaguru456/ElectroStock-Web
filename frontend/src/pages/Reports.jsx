import { useEffect, useState } from "react";
import apiClient from "../api/client";

const REPORT_TYPES = [
  { key: "inventory", label: "Inventory" },
  { key: "low-stock", label: "Low Stock" },
  { key: "sales", label: "Sales" },
  { key: "purchases", label: "Purchases" },
  { key: "stock-movement", label: "Stock Movement" },
  { key: "employee-performance", label: "Employee Performance" },
];

export default function Reports() {
  const [reportType, setReportType] = useState("inventory");
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/warehouses").then((res) => setWarehouses(res.data.data)).catch(() => {});
  }, []);

  function buildParams(format) {
    const params = {};
    if (warehouseId) params.warehouseId = warehouseId;
    if (from) params.from = from;
    if (to) params.to = to;
    if (format) params.format = format;
    return params;
  }

  async function runReport() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(`/reports/${reportType}`, { params: buildParams() });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType]);

  async function exportCsv() {
    const res = await apiClient.get(`/reports/${reportType}`, {
      params: buildParams("csv"),
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  const rows = Array.isArray(data) ? data : data?.orders || data?.items || [];

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
        <button onClick={exportCsv} disabled={loading}>
          Export CSV
        </button>
      </div>

      <div className="filters">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          {REPORT_TYPES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          <option value="">All warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button onClick={runReport}>Apply</button>
      </div>

      {data?.totalRevenue !== undefined && <p>Total revenue (confirmed+): {data.totalRevenue}</p>}
      {data?.totalSpend !== undefined && <p>Total spend (ordered+): {data.totalSpend}</p>}

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p className="empty-state">No data for this report.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                {Object.keys(rows[0])
                  .filter((k) => typeof rows[0][k] !== "object" || rows[0][k] === null)
                  .map((k) => (
                    <th key={k}>{k}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id || i}>
                  {Object.keys(rows[0])
                    .filter((k) => typeof rows[0][k] !== "object" || rows[0][k] === null)
                    .map((k) => (
                      <td key={k}>{String(row[k])}</td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
