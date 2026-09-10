import { useEffect, useState } from "react";
import apiClient from "../api/client";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/notifications");
      setItems(res.data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    }
  }

  async function markAllRead() {
    try {
      await apiClient.put("/notifications/read-all");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
        <button onClick={markAllRead}>Mark all as read</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p className="empty-state">No notifications.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Message</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id} style={{ fontWeight: n.isRead ? "normal" : 600 }}>
                <td>{new Date(n.createdAt).toLocaleString()}</td>
                <td>{n.type}</td>
                <td>{n.message}</td>
                <td>
                  {!n.isRead && <button onClick={() => markRead(n.id)}>Mark read</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
