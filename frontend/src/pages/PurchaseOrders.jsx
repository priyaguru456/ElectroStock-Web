import { useEffect, useState } from "react";
import apiClient from "../api/client";

const STATUSES = ["DRAFT", "ORDERED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"];

const emptyForm = {
  supplierId: "",
  warehouseId: "",
  expectedDate: "",
  items: [{ productId: "", quantity: "1", unitCost: "0" }],
};

export default function PurchaseOrders() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
  const [receiveQtys, setReceiveQtys] = useState({});
  const [detailError, setDetailError] = useState("");
  const [detailBusy, setDetailBusy] = useState(false);

  async function loadLookups() {
    const [supRes, whRes, prodRes] = await Promise.all([
      apiClient.get("/suppliers"),
      apiClient.get("/warehouses"),
      apiClient.get("/products", { params: { limit: 500 } }),
    ]);
    setSuppliers(supRes.data.data);
    setWarehouses(whRes.data.data);
    setProducts(prodRes.data.data.items);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get("/purchases", { params });
      setItems(res.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load purchase orders");
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
    setForm({ ...form, items: [...form.items, { productId: "", quantity: "1", unitCost: "0" }] });
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
        supplierId: Number(form.supplierId),
        warehouseId: Number(form.warehouseId),
        expectedDate: form.expectedDate || null,
        items: form.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
        })),
      };
      await apiClient.post("/purchases", payload);
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
      const res = await apiClient.get(`/purchases/${id}`);
      setDetail(res.data.data);
      const initialQtys = {};
      res.data.data.items.forEach((item) => {
        initialQtys[item.id] = "";
      });
      setReceiveQtys(initialQtys);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load purchase order");
    }
  }

  async function markOrdered() {
    setDetailBusy(true);
    setDetailError("");
    try {
      await apiClient.post(`/purchases/${detail.id}/order`);
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
      await apiClient.post(`/purchases/${detail.id}/cancel`);
      await openDetail(detail.id);
      await load();
    } catch (err) {
      setDetailError(err.response?.data?.message || "Action failed");
    } finally {
      setDetailBusy(false);
    }
  }

  async function submitReceive() {
    setDetailBusy(true);
    setDetailError("");
    try {
      const toReceive = Object.entries(receiveQtys)
        .filter(([, qty]) => qty && Number(qty) > 0)
        .map(([itemId, qty]) => ({ itemId: Number(itemId), quantityReceived: Number(qty) }));

      if (toReceive.length === 0) {
        setDetailError("Enter a quantity to receive for at least one line item");
        return;
      }

      await apiClient.post(`/purchases/${detail.id}/receive`, { items: toReceive });
      await openDetail(detail.id);
      await load();
    } catch (err) {
      setDetailError(err.response?.data?.message || "Receive failed");
    } finally {
      setDetailBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Purchase Orders</h1>
        <button onClick={openCreate}>+ New purchase order</button>
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
        <p className="empty-state">No purchase orders yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Supplier</th>
              <th>Warehouse</th>
              <th>Status</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((po) => (
              <tr key={po.id}>
                <td>{po.id}</td>
                <td>{po.supplier.name}</td>
                <td>{po.warehouse.name}</td>
                <td>{po.status}</td>
                <td>{po.totalAmount}</td>
                <td className="row-actions">
                  <button onClick={() => openDetail(po.id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <form className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>New purchase order</h2>
            {formError && <div className="error-banner">{formError}</div>}

            <label>Supplier</label>
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} required>
              <option value="">Select…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <label>Warehouse (destination)</label>
            <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} required>
              <option value="">Select…</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <label>Expected date</label>
            <input
              type="date"
              value={form.expectedDate}
              onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
            />

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
                  placeholder="Unit cost"
                  value={item.unitCost}
                  onChange={(e) => updateItem(index, "unitCost", e.target.value)}
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
                {submitting ? "Saving…" : "Save as draft"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
            <h2>
              Purchase order #{detail.id} — {detail.status}
            </h2>
            <p>
              {detail.supplier.name} → {detail.warehouse.name}
            </p>

            {detailError && <div className="error-banner">{detailError}</div>}

            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Ordered</th>
                  <th>Received</th>
                  <th>Unit cost</th>
                  {["ORDERED", "PARTIALLY_RECEIVED"].includes(detail.status) && <th>Receive now</th>}
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product.sku}</td>
                    <td>{item.quantityOrdered}</td>
                    <td>{item.quantityReceived}</td>
                    <td>{item.unitCost}</td>
                    {["ORDERED", "PARTIALLY_RECEIVED"].includes(detail.status) && (
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={item.quantityOrdered - item.quantityReceived}
                          value={receiveQtys[item.id] || ""}
                          onChange={(e) => setReceiveQtys({ ...receiveQtys, [item.id]: e.target.value })}
                          style={{ width: 70 }}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="modal-actions">
              <button type="button" onClick={() => setDetail(null)}>
                Close
              </button>
              {detail.status === "DRAFT" && (
                <button type="button" disabled={detailBusy} onClick={markOrdered}>
                  Mark as ordered
                </button>
              )}
              {["DRAFT", "ORDERED"].includes(detail.status) && (
                <button type="button" disabled={detailBusy} onClick={cancelOrder}>
                  Cancel order
                </button>
              )}
              {["ORDERED", "PARTIALLY_RECEIVED"].includes(detail.status) && (
                <button type="button" disabled={detailBusy} onClick={submitReceive}>
                  Receive items
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
