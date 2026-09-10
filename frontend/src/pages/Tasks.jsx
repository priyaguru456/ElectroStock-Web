import { useEffect, useState } from "react";
import apiClient from "../api/client";
import Can from "../components/Can";

const TASK_TYPES = ["PICKING", "PACKING", "DISPATCH", "STOCK_COUNT", "TRANSFER", "RECEIVING", "OTHER"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const TASK_STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const MANAGING_ROLES = ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER", "TEAM_LEADER"];

const emptyForm = {
  title: "",
  description: "",
  type: "PICKING",
  priority: "MEDIUM",
  warehouseId: "",
  assignedToId: "",
  dueDate: "",
};

export default function Tasks() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [warehouses, setWarehouses] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadLookups() {
    const res = await apiClient.get("/warehouses");
    setWarehouses(res.data.data);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (warehouseFilter) params.warehouse = warehouseFilter;
      const res = await apiClient.get("/tasks", { params });
      setItems(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, priorityFilter, warehouseFilter]);

  function openCreate() {
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await apiClient.post("/tasks", {
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        priority: form.priority,
        warehouseId: Number(form.warehouseId),
        assignedToId: form.assignedToId ? Number(form.assignedToId) : null,
        dueDate: form.dueDate || null,
      });
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(task, status) {
    setError("");
    try {
      await apiClient.patch(`/tasks/${task.id}/status`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Status update failed");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Warehouse Tasks</h1>
        <Can roles={MANAGING_ROLES}>
          <button onClick={openCreate}>+ New task</button>
        </Can>
      </div>

      <div className="filters">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
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
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No tasks yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Warehouse</th>
              <th>Assigned to</th>
              <th>Due</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.type}</td>
                <td>{task.priority}</td>
                <td>{task.warehouse?.name || "—"}</td>
                <td>{task.assignedTo?.name || "Unassigned"}</td>
                <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</td>
                <td>{task.status}</td>
                <td className="row-actions">
                  {task.status !== "IN_PROGRESS" && task.status !== "COMPLETED" && task.status !== "CANCELLED" && (
                    <button onClick={() => changeStatus(task, "IN_PROGRESS")}>Start</button>
                  )}
                  {task.status === "IN_PROGRESS" && (
                    <button onClick={() => changeStatus(task, "COMPLETED")}>Complete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: 8, color: "var(--muted, #666)" }}>{total} task(s)</p>

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <h2>New task</h2>
            {formError && <div className="error-banner">{formError}</div>}

            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />

            <label>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <label>Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <label>Warehouse</label>
            <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} required>
              <option value="">Select warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <label>Assign to (user ID)</label>
            <input
              type="number"
              value={form.assignedToId}
              onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
            />

            <label>Due date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
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
