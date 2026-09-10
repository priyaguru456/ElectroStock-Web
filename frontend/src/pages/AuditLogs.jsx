import { Fragment, useEffect, useState } from "react";
import apiClient from "../api/client";

export default function AuditLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entityType, setEntityType] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (entityType) params.entityType = entityType;
      const res = await apiClient.get("/audit", { params });
      setItems(res.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType]);

  return (
    <div>
      <div className="page-header">
        <h1>Audit Logs</h1>
      </div>

      <div className="filters">
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="">All entity types</option>
          <option value="User">User</option>
          <option value="PurchaseOrder">Purchase Order</option>
          <option value="SalesOrder">Sales Order</option>
          <option value="Employee">Employee</option>
          <option value="Department">Department</option>
          <option value="Shift">Shift</option>
          <option value="WarehouseTask">Warehouse Task</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No audit log entries yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((log) => (
              <Fragment key={log.id}>
                <tr>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.user?.name || "—"}</td>
                  <td>{log.action}</td>
                  <td>
                    {log.entityType} #{log.entityId}
                  </td>
                  <td>
                    <button onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                      {expandedId === log.id ? "Hide" : "Details"}
                    </button>
                  </td>
                </tr>
                {expandedId === log.id && (
                  <tr>
                    <td colSpan={5}>
                      <div style={{ display: "flex", gap: 24 }}>
                        <div>
                          <strong>Old value</strong>
                          <pre>{JSON.stringify(log.oldValue, null, 2)}</pre>
                        </div>
                        <div>
                          <strong>New value</strong>
                          <pre>{JSON.stringify(log.newValue, null, 2)}</pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
