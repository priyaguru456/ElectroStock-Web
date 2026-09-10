import { useEffect, useState } from "react";
import apiClient from "../api/client";

const REASONS = ["DAMAGE", "LOSS", "RECOUNT", "OTHER"];

const emptyForm = { productId: "", warehouseId: "", quantityChange: "", reason: "RECOUNT", notes: "" };

export default function StockAdjustments() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadLookups() {
    const [prodRes, whRes] = await Promise.all([
      apiClient.get("/products", { params: { limit: 500 } }),
      apiClient.get("/warehouses"),
    ]);
    setProducts(prodRes.data.data.items);
    setWarehouses(whRes.data.data);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/inventory/adjustments");
      setItems(res.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load adjustments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await apiClient.post("/inventory/adjustments", {
        productId: Number(form.productId),
        warehouseId: Number(form.warehouseId),
        quantityChange: Number(form.quantityChange),
        reason: form.reason,
        notes: form.notes,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Adjustment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Stock Adjustments</h1>
      </div>

      <form className="modal" style={{ margin: "0 0 24px", width: "100%", maxWidth: 480 }} onSubmit={handleSubmit}>
        <h2>New adjustment</h2>
        {formError && <div className="error-banner">{formError}</div>}

        <label>Product</label>
        <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
          <option value="">Select…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.name}
            </option>
          ))}
        </select>

        <label>Warehouse</label>
        <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} required>
          <option value="">Select…</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        <label>Quantity change (positive to add, negative to remove)</label>
        <input
          type="number"
          value={form.quantityChange}
          onChange={(e) => setForm({ ...form, quantityChange: e.target.value })}
          required
        />

        <label>Reason</label>
        <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label>Notes</label>
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

        <div className="modal-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Record adjustment"}
          </button>
        </div>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No adjustments recorded yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Change</th>
              <th>Reason</th>
              <th>Notes</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {items.map((adj) => (
              <tr key={adj.id}>
                <td>{new Date(adj.createdAt).toLocaleString()}</td>
                <td>{adj.product.name}</td>
                <td>{adj.warehouse.name}</td>
                <td>{adj.quantityChange > 0 ? `+${adj.quantityChange}` : adj.quantityChange}</td>
                <td>{adj.reason}</td>
                <td>{adj.notes || "—"}</td>
                <td>{adj.performedBy?.name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
