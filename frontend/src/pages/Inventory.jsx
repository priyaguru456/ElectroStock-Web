import { useEffect, useState } from "react";
import apiClient from "../api/client";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    apiClient.get("/warehouses").then((res) => setWarehouses(res.data.data)).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (warehouseId) params.warehouseId = warehouseId;
      if (lowStockOnly) params.lowStockOnly = "true";
      const res = await apiClient.get("/inventory", { params });
      setItems(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, lowStockOnly]);

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
      </div>

      <div className="filters">
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          <option value="">All warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No stock recorded yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Warehouse</th>
              <th>Quantity</th>
              <th>Reorder level</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{row.product.name}</td>
                <td>{row.product.sku}</td>
                <td>{row.warehouse.name}</td>
                <td>
                  {row.quantity} {row.product.unit}
                </td>
                <td>{row.product.reorderLevel}</td>
                <td>{row.isLowStock && <span className="badge-low-stock">Low stock</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
