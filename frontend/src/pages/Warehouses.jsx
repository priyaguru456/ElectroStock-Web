import { useEffect, useState } from "react";
import apiClient from "../api/client";

const emptyForm = { id: null, name: "", address: "" };

export default function Warehouses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/warehouses");
      setItems(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(item) {
    setForm({ id: item.id, name: item.name, address: item.address || "" });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const payload = { name: form.name, address: form.address };
      if (form.id) {
        await apiClient.put(`/warehouses/${form.id}`, payload);
      } else {
        await apiClient.post("/warehouses", payload);
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
        await apiClient.delete(`/warehouses/${item.id}`);
      } else {
        await apiClient.put(`/warehouses/${item.id}`, { isActive: true });
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Warehouses</h1>
        <button onClick={openCreate}>+ New warehouse</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No warehouses yet — add your first one.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.address || "—"}</td>
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
            <h2>{form.id ? "Edit warehouse" : "New warehouse"}</h2>
            {formError && <div className="error-banner">{formError}</div>}
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <label>Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
