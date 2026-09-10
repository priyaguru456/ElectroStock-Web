import { useEffect, useState } from "react";
import apiClient from "../api/client";

const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "WAREHOUSE_MANAGER",
  "TEAM_LEADER",
  "WAREHOUSE_STAFF",
  "SALES_MANAGER",
  "SALES_STAFF",
  "TELECALLER",
];

const emptyForm = {
  id: null,
  name: "",
  email: "",
  password: "",
  role: "WAREHOUSE_STAFF",
  phone: "",
  designation: "",
  photoUrl: "",
  departmentId: "",
  shiftId: "",
  warehouseId: "",
  managerId: "",
  status: "ACTIVE",
};

export default function Employees() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadLookups() {
    const [deptRes, shiftRes, whRes] = await Promise.all([
      apiClient.get("/departments"),
      apiClient.get("/shifts"),
      apiClient.get("/warehouses"),
    ]);
    setDepartments(deptRes.data.data);
    setShifts(shiftRes.data.data);
    setWarehouses(whRes.data.data);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (departmentFilter) params.department = departmentFilter;
      if (warehouseFilter) params.warehouse = warehouseFilter;
      if (shiftFilter) params.shift = shiftFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get("/employees", { params });
      setItems(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employees");
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
  }, [search, departmentFilter, warehouseFilter, shiftFilter, statusFilter]);

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(item) {
    const profile = item.employeeProfile || {};
    setForm({
      id: item.id,
      name: item.name,
      email: item.email,
      password: "",
      role: item.role,
      status: item.status,
      phone: profile.phone || "",
      designation: profile.designation || "",
      photoUrl: profile.photoUrl || "",
      departmentId: profile.department?.id || "",
      shiftId: profile.shift?.id || "",
      warehouseId: profile.warehouse?.id || "",
      managerId: profile.manager?.id || "",
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await apiClient.post("/employees", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
        designation: form.designation || undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        shiftId: form.shiftId ? Number(form.shiftId) : null,
        warehouseId: form.warehouseId ? Number(form.warehouseId) : null,
        managerId: form.managerId ? Number(form.managerId) : null,
      });
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await apiClient.put(`/employees/${form.id}`, {
        name: form.name,
        role: form.role,
        status: form.status,
        phone: form.phone,
        designation: form.designation,
        photoUrl: form.photoUrl || null,
      });
      await apiClient.post(`/employees/${form.id}/assign`, {
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        shiftId: form.shiftId ? Number(form.shiftId) : null,
        warehouseId: form.warehouseId ? Number(form.warehouseId) : null,
        managerId: form.managerId ? Number(form.managerId) : null,
      });
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Employees</h1>
        <button onClick={openCreate}>+ New employee</button>
      </div>

      <div className="filters">
        <input placeholder="Search name, email, code…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
          <option value="">All warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
          <option value="">All shifts</option>
          {shifts.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On leave</option>
          <option value="RESIGNED">Resigned</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No employees yet — add your first one.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Shift</th>
              <th>Warehouse</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.employeeProfile?.employeeCode || "—"}</td>
                <td>{item.name}</td>
                <td>{item.role}</td>
                <td>{item.employeeProfile?.department?.name || "—"}</td>
                <td>{item.employeeProfile?.shift?.name || "—"}</td>
                <td>{item.employeeProfile?.warehouse?.name || "—"}</td>
                <td>{item.status}</td>
                <td className="row-actions">
                  <button onClick={() => openEdit(item)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: 8, color: "var(--muted, #666)" }}>{total} employee(s)</p>

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={form.id ? handleUpdate : handleCreate}
          >
            <h2>{form.id ? "Edit employee" : "New employee"}</h2>
            {formError && <div className="error-banner">{formError}</div>}

            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={!!form.id}
              required
            />

            {!form.id && (
              <>
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required
                />
              </>
            )}

            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {form.id && (
              <>
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On leave</option>
                  <option value="RESIGNED">Resigned</option>
                </select>
              </>
            )}

            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

            <label>Designation</label>
            <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />

            {form.id && (
              <>
                <label>Photo URL</label>
                <input
                  type="url"
                  value={form.photoUrl}
                  onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                  placeholder="https://…"
                />
              </>
            )}

            <label>Department</label>
            <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <label>Shift</label>
            <select value={form.shiftId} onChange={(e) => setForm({ ...form, shiftId: e.target.value })}>
              <option value="">None</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <label>Warehouse</label>
            <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
              <option value="">None</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <label>Manager (user ID)</label>
            <input
              type="number"
              value={form.managerId}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
            />

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
