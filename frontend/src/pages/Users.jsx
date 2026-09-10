import { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

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

const STATUSES = ["ACTIVE", "ON_LEAVE", "RESIGNED"];

const STATUS_LABEL = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  RESIGNED: "Resigned",
};

const STATUS_BADGE_CLASS = {
  ACTIVE: "badge-active",
  ON_LEAVE: "badge-on-leave",
  RESIGNED: "badge-resigned",
};

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

const emptyForm = { id: null, name: "", email: "", password: "", role: "WAREHOUSE_STAFF" };

export default function Users() {
  const { user: currentUser } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(currentUser?.role);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.get("/users", { params });
      setItems(res.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter]);

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(user) {
    setForm({ id: user.id, name: user.name, email: user.email, password: "", role: user.role });
    setFormError("");
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      if (form.id) {
        const payload = { name: form.name };
        if (isAdmin) payload.role = form.role;
        await apiClient.put(`/users/${form.id}`, payload);
      } else {
        await apiClient.post("/users", {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(user, status) {
    try {
      await apiClient.post(`/users/${user.id}/status`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <button onClick={openCreate}>+ New user</button>
      </div>

      <div className="filters">
        <input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {isAdmin && (
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No users found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={STATUS_BADGE_CLASS[user.status]}>{STATUS_LABEL[user.status]}</span>
                </td>
                <td className="row-actions">
                  <button onClick={() => openEdit(user)}>Edit</button>
                  {user.status !== "ACTIVE" && (
                    <button onClick={() => changeStatus(user, "ACTIVE")}>Set Active</button>
                  )}
                  {user.status !== "ON_LEAVE" && (
                    <button onClick={() => changeStatus(user, "ON_LEAVE")}>Set On Leave</button>
                  )}
                  {user.status !== "RESIGNED" && (
                    <button onClick={() => changeStatus(user, "RESIGNED")}>Set Resigned</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{form.id ? "Edit user" : "New user"}</h2>

            {formError && <div className="error-banner">{formError}</div>}

            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

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
                  required
                />
              </>
            )}

            {(!form.id || isAdmin) && (
              <>
                <label>Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  disabled={!!form.id && !isAdmin}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </>
            )}

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
