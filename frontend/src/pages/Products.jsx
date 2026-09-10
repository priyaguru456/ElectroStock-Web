import { useEffect, useState } from "react";
import apiClient from "../api/client";

const emptyForm = {
  id: null,
  sku: "",
  name: "",
  categoryId: "",
  unit: "pcs",
  unitPrice: "",
  reorderLevel: "0",
  defaultSupplierId: "",
  description: "",
};

export default function Products() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadLookups() {
    const [catsRes, supsRes] = await Promise.all([
      apiClient.get("/categories"),
      apiClient.get("/suppliers"),
    ]);
    setCategories(catsRes.data.data);
    setSuppliers(supsRes.data.data);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      const res = await apiClient.get("/products", { params });
      setItems(res.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
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
  }, [search, categoryFilter]);

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(item) {
    setForm({
      id: item.id,
      sku: item.sku,
      name: item.name,
      categoryId: item.categoryId || "",
      unit: item.unit,
      unitPrice: String(item.unitPrice),
      reorderLevel: String(item.reorderLevel),
      defaultSupplierId: item.defaultSupplierId || "",
      description: item.description || "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const shared = {
        name: form.name,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        unit: form.unit,
        unitPrice: Number(form.unitPrice),
        reorderLevel: Number(form.reorderLevel),
        defaultSupplierId: form.defaultSupplierId ? Number(form.defaultSupplierId) : null,
        description: form.description,
      };
      if (form.id) {
        await apiClient.put(`/products/${form.id}`, shared);
      } else {
        await apiClient.post("/products", { sku: form.sku, ...shared });
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(item) {
    setError("");
    try {
      if (item.isActive) {
        await apiClient.delete(`/products/${item.id}`);
      } else {
        await apiClient.put(`/products/${item.id}`, { isActive: true });
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Products</h1>
        <button onClick={openCreate}>+ New product</button>
      </div>

      <div className="filters">
        <input placeholder="Search name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No products yet — add your first one.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit price</th>
              <th>Reorder level</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.sku}</td>
                <td>{item.name}</td>
                <td>{item.category?.name || "—"}</td>
                <td>{item.unitPrice}</td>
                <td>{item.reorderLevel}</td>
                <td>{item.isActive ? "Active" : "Inactive"}</td>
                <td className="row-actions">
                  <button onClick={() => openEdit(item)}>Edit</button>
                  <button onClick={() => toggleActive(item)}>
                    {item.isActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{form.id ? "Edit product" : "New product"}</h2>
            {formError && <div className="error-banner">{formError}</div>}

            <label>SKU</label>
            <input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              disabled={!!form.id}
              required
            />

            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

            <label>Category</label>
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <label>Default supplier</label>
            <select
              value={form.defaultSupplierId}
              onChange={(e) => setForm({ ...form, defaultSupplierId: e.target.value })}
            >
              <option value="">None</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <label>Unit</label>
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />

            <label>Unit price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
              required
            />

            <label>Reorder level</label>
            <input
              type="number"
              min="0"
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
              required
            />

            <label>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <div className="modal-actions">
              <button type="button" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
