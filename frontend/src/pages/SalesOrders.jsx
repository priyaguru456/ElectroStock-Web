import { useEffect, useState } from "react";
import apiClient from "../api/client";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const FORWARD_TRANSITIONS = { CONFIRMED: "PROCESSING", PROCESSING: "SHIPPED", SHIPPED: "DELIVERED" };

const emptyForm = {
  customerId: "",
  warehouseId: "",
  items: [{ productId: "", quantity: "1", unitPrice: "0" }],
};

export default function SalesOrders() {
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
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
    const [custRes, whRes, prodRes] = await Promise.all([
      apiClient.get("/customers"),
      apiClient.get("/warehouses"),
      apiClient.get("/products", { params: { limit: 500 } }),
    ]);
    setCustomers(custRes.data.data);
    setWarehouses(whRes.data.data);
    setProducts(prodRes.data.data.items);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get("/sales", { params });
      setItems(res.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sales orders");
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
    setForm({ ...form, items: [...form.items, { productId: "", quantity: "1", unitPrice: "0" }] });
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
        customerId: Number(form.customerId),
        warehouseId: Number(form.warehouseId),
        items: form.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };
      await apiClient.post("/sales", payload);
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
      const res = await apiClient.get(`/sales/${id}`);
      setDetail(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sales order");
    }
  }

  async function confirmOrder() {
    setDetailBusy(true);
    setDetailError("");
    try {
      await apiClient.post(`/sales/${detail.id}/confirm`);
      await openDetail(detail.id);
      await load();
    } catch (err) {
      setDetailError(err.response?.data?.message || "Confirm failed");
    } finally {
      setDetailBusy(false);
    }
  }

  async function advanceStatus() {
    const nextStatus = FORWARD_TRANSITIONS[detail.status];
    if (!nextStatus) return;
    setDetailBusy(true);
    setDetailError("");
    try {
      await apiClient.post(`/sales/${detail.id}/status`, { status: nextStatus });
      await openDetail(detail.id);
      await load();
    } catch (err) {
      setDetailError(err.response?.data?.message || "Action failed");
    } finally {
      setDetailBusy(false);
    }
  }

  async function cancelOrder() {
    setDetailBusy(true);
    setDetailError("");
    try {
      await apiClient.post(`/sales/${detail.id}/cancel`);
      await openDetail(detail.id);
      await load();
    } catch (err) {
      setDetailError(err.response?.data?.message || "Cancel failed");
    } finally {
      setDetailBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Sales Orders</h1>
        <button onClick={openCreate}>+ New sales order</button>
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
        <p className="empty-state">No sales orders yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer</th>
              <th>Warehouse</th>
              <th>Status</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((so) => (
              <tr key={so.id}>
                <td>{so.id}</td>
                <td>{so.customer.name}</td>
                <td>{so.warehouse.name}</td>
                <td>{so.status}</td>
                <td>{so.totalAmount}</td>
                <td className="row-actions">
                  <button onClick={() => openDetail(so.id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <form className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>New sales order</h2>
            {formError && <div className="error-banner">{formError}</div>}

            <label>Customer</label>
            <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
              <option value="">Select…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label>Warehouse (source)</label>
            <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} required>
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
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Unit price"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
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
                {submitting ? "Saving…" : "Create order"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
            <h2>
              Sales order #{detail.id} — {detail.status}
            </h2>
            <p>
              {detail.customer.name} ← {detail.warehouse.name}
            </p>

            {detailError && <div className="error-banner">{detailError}</div>}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit price</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product.sku}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unitPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="modal-actions">
              <button type="button" onClick={() => setDetail(null)}>
                Close
              </button>
              {detail.status === "PENDING" && (
                <button type="button" disabled={detailBusy} onClick={confirmOrder}>
                  Confirm order
                </button>
              )}
              {FORWARD_TRANSITIONS[detail.status] && (
                <button type="button" disabled={detailBusy} onClick={advanceStatus}>
                  Mark as {FORWARD_TRANSITIONS[detail.status]}
                </button>
              )}
              {!["DELIVERED", "CANCELLED"].includes(detail.status) && (
                <button type="button" disabled={detailBusy} onClick={cancelOrder}>
                  Cancel order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
