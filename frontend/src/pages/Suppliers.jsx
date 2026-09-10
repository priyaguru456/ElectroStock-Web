import { useEffect, useState } from "react";
import apiClient from "../api/client";

const emptyForm = { id: null, name: "", contactName: "", email: "", phone: "", address: "" };

export default function Suppliers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      const res = await apiClient.get("/suppliers", { params });
      setItems(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(item) {
    setForm({
      id: item.id,
      name: item.name,
      contactName: item.contactName || "",
      email: item.email || "",
      phone: item.phone || "",
      address: item.address || "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        name: form.name,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        address: form.address,
      };
      if (form.id) {
        await apiClient.put(`/suppliers/${form.id}`, payload);
      } else {
        await apiClient.post("/suppliers", payload);
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
    try {
      await apiClient.put(`/suppliers/${item.id}`, { isActive: !item.isActive });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Suppliers</h1>
        <button onClick={openCreate}>+ New supplier</button>
      </div>

      <div className="filters">
        <input placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No suppliers yet — add your first one.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.contactName || "—"}</td>
                <td>{item.email || "—"}</td>
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
            <h2>{form.id ? "Edit supplier" : "New supplier"}</h2>
            {formError && <div className="error-banner">{formError}</div>}
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <label>Contact name</label>
            <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
