import { useEffect, useState } from "react";
import apiClient from "../api/client";

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString();
}

export default function Attendance() {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function loadToday() {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const res = await apiClient.get("/attendance/me", { params: { from: todayStr, to: todayStr } });
      setTodayRecord(res.data.data.items[0] || null);
    } catch {
      setTodayRecord(null);
    }
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await apiClient.get("/attendance/me", { params });
      setHistory(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadToday();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  async function handleCheckIn() {
    setActionLoading(true);
    setActionError("");
    try {
      await apiClient.post("/attendance/check-in");
      await Promise.all([load(), loadToday()]);
    } catch (err) {
      setActionError(err.response?.data?.message || "Check-in failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    setActionError("");
    try {
      await apiClient.post("/attendance/check-out");
      await Promise.all([load(), loadToday()]);
    } catch (err) {
      setActionError(err.response?.data?.message || "Check-out failed");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Attendance</h1>
        <div className="row-actions">
          <button onClick={handleCheckIn} disabled={actionLoading || !!todayRecord?.checkInAt}>
            Check In
          </button>
          <button
            onClick={handleCheckOut}
            disabled={actionLoading || !todayRecord?.checkInAt || !!todayRecord?.checkOutAt}
          >
            Check Out
          </button>
        </div>
      </div>

      <div className="filters">
        <label style={{ alignSelf: "center" }}>From</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <label style={{ alignSelf: "center" }}>To</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {actionError && <div className="error-banner">{actionError}</div>}
      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : history.length === 0 ? (
        <p className="empty-state">No attendance recorded yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
              <th>Working hours</th>
              <th>Late</th>
              <th>Early checkout</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.id}>
                <td>{formatDate(row.date)}</td>
                <td>{formatTime(row.checkInAt)}</td>
                <td>{formatTime(row.checkOutAt)}</td>
                <td>{row.status}</td>
                <td>{row.workingMinutes != null ? `${(row.workingMinutes / 60).toFixed(1)}h` : "—"}</td>
                <td>{row.isLate ? "Yes" : "No"}</td>
                <td>{row.isEarlyCheckout ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: 8, color: "var(--muted, #666)" }}>{total} record(s)</p>
    </div>
  );
}
