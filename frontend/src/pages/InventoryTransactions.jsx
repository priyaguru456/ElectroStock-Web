import { useEffect, useState } from "react";
import apiClient from "../api/client";

const TYPES = ["PURCHASE_IN", "SALE_OUT", "SALE_CANCELLED", "TRANSFER_IN", "TRANSFER_OUT", "ADJUSTMENT"];

export default function InventoryTransactions() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    apiClient.get("/warehouses").then((res) => setWarehouses(res.data.data)).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit };
      if (warehouseId) params.warehouseId = warehouseId;
      if (type) params.type = type;
      const res = await apiClient.get("/inventory/transactions", { params });
      setItems(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, type, page]);

  useEffect(() => {
    setPage(1);
  }, [warehouseId, type]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="page-header">
        <h1>Inventory Transactions</h1>
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
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No stock movements recorded yet.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Type</th>
                <th>Change</th>
                <th>Before → After</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.createdAt).toLocaleString()}</td>
                  <td>{tx.product.name}</td>
                  <td>{tx.warehouse.name}</td>
                  <td>{tx.type}</td>
                  <td>{tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}</td>
                  <td>
                    {tx.quantityBefore} → {tx.quantityAfter}
                  </td>
                  <td>{tx.performedBy?.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
