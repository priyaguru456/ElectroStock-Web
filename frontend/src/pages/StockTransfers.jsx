import { useEffect, useState } from "react";
import apiClient from "../api/client";

const STATUSES = ["PENDING", "COMPLETED", "CANCELLED"];

const emptyForm = {
  sourceWarehouseId: "",
  destinationWarehouseId: "",
  items: [{ productId: "", quantity: "1" }],
};

export default function StockTransfers() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState("");
  const [detailBusy, setDetailBusy] = useState(false);

  async function loadLookups() {
    const [whRes, prodRes] = await Promise.all([
      apiClient.get("/warehouses"),
      apiClient.get("/products", { params: { limit: 500 } }),
    ]);
    setWarehouses(whRes.data.data);
    setProducts(prodRes.data.data.items);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get("/transfers", { params });
      setItems(res.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transfers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function updateItem(index, field, value) {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  }

  function addItemRow() {
    setForm({ ...form, items: [...form.items, { productId: "", quantity: "1" }] });
  }

  function removeItemRow(index) {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        sourceWarehouseId: Number(form.sourceWarehouseId),
        destinationWarehouseId: Number(form.destinationWarehouseId),
        items: form.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })),
      };
      await apiClient.post("/transfers", payload);
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function openDetail(id) {
    setDetailError("");
    try {
      const res = await apiClient.get(`/transfers/${id}`);
      setDetail(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transfer");
    }
  }

  async function completeTransfer() {
    setDetailBusy(true);
    setDetailError("");
    try {
      await apiClient.post(`/transfers/${detail.id}/complete`);
      await openDetail(detail.id);
      await load();
    } catch (err) {
      setDetailError(err.response?.data?.message || "Action failed");
    } finally {
      setDetailBusy(false);
    }
  }

  async function cancelTransfer() {
    setDetailBusy(true);
    setDetailError("");
    try {
      await apiClient.post(`/transfers/${detail.id}/cancel`);
      await openDetail(detail.id);
      await load();
    } catch (err) {
      setDetailError(err.response?.data?.message || "Action failed");
    } finally {
      setDetailBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Stock Transfers</h1>
        <button onClick={openCreate}>+ New transfer</button>
      </div>

      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No stock transfers yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.sourceWarehouse.name}</td>
                <td>{t.destinationWarehouse.name}</td>
                <td>{t.status}</td>
                <td className="row-actions">
                  <button onClick={() => openDetail(t.id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <form className="modal" style={{ width: 440 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>New stock transfer</h2>
            {formError && <div className="error-banner">{formError}</div>}

            <label>Source warehouse</label>
            <select
              value={form.sourceWarehouseId}
              onChange={(e) => setForm({ ...form, sourceWarehouseId: e.target.value })}
              required
            >
              <option value="">Select…</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <label>Destination warehouse</label>
            <select
              value={form.destinationWarehouseId}
              onChange={(e) => setForm({ ...form, destinationWarehouseId: e.target.value })}
              required
            >
              <option value="">Select…</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <label>Line items</label>
            {form.items.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(index, "productId", e.target.value)}
                  required
                  style={{ flex: 2 }}
                >
                  <option value="">Product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                {form.items.length > 1 && (
                  <button type="button" onClick={() => removeItemRow(index)}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addItemRow}>
              + Add line
            </button>

            <div className="modal-actions">
              <button type="button" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Create transfer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
            <h2>
              Transfer #{detail.id} — {detail.status}
            </h2>
            <p>
              {detail.sourceWarehouse.name} → {detail.destinationWarehouse.name}
            </p>

            {detailError && <div className="error-banner">{detailError}</div>}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product.sku}</td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="modal-actions">
              <button type="button" onClick={() => setDetail(null)}>
                Close
              </button>
              {detail.status === "PENDING" && (
                <>
                  <button type="button" disabled={detailBusy} onClick={cancelTransfer}>
                    Cancel transfer
                  </button>
                  <button type="button" disabled={detailBusy} onClick={completeTransfer}>
                    Complete transfer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
