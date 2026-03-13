import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as notificationsApi from "../api/notifications.js";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" }
];

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN");
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.isRead);
    }
    return notifications;
  }, [filter, notifications]);

  const handleMarkRead = async (notificationId) => {
    setMarkingId(notificationId);
    setError("");
    try {
      await notificationsApi.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item
        )
      );
    } catch (err) {
      setError(err.message || "Failed to mark notification as read");
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <div className="hero-title">Notifications</div>
          <div className="hero-subtitle">
            Keep up with updates across your events.
          </div>
          <div className="hero-meta">
            <span className="meta-pill">
              Total <strong>{notifications.length}</strong>
            </span>
            <span className="meta-pill">
              Unread <strong>{unreadCount}</strong>
            </span>
          </div>
        </div>
        <div className="hero-actions">
          <div className="tabs">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={filter === item.value ? "tab active" : "tab"}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? <div className="card">Loading notifications...</div> : null}
      {error ? <div className="card error">{error}</div> : null}

      {!loading && !visibleNotifications.length ? (
        <div className="card muted">No notifications yet.</div>
      ) : null}

      {!loading && visibleNotifications.length ? (
        <div className="card">
          <div className="list">
            {visibleNotifications.map((item) => (
              <div key={item.id} className="list-item">
                <div>
                  <div className="list-title">{item.title}</div>
                  <div className="list-meta">{item.message}</div>
                  <div className="card-meta">
                    Type: {item.type || "general"} ·{" "}
                    {formatDate(item.createdAt)}
                  </div>
                </div>
                <div className="list-actions">
                  <div className={item.isRead ? "badge soft" : "badge"}>
                    {item.isRead ? "Read" : "Unread"}
                  </div>
                  {item.eventId ? (
                    <Link
                      to={`/events/${item.eventId}`}
                      className="btn ghost"
                    >
                      View event
                    </Link>
                  ) : null}
                  {!item.isRead ? (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => handleMarkRead(item.id)}
                      disabled={markingId === item.id}
                    >
                      {markingId === item.id ? "Marking..." : "Mark read"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
