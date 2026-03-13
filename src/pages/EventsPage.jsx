import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as eventsApi from "../api/events.js";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const adminCount = events.filter((item) =>
    ["SUPER_ADMIN", "ADMIN"].includes(item.role)
  ).length;
  const managerCount = events.filter((item) =>
    ["MANAGER"].includes(item.role)
  ).length;

  const loadEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await eventsApi.getEvents();
      setEvents(data || []);
    } catch (err) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    setCreating(true);
    try {
      await eventsApi.createEvent({
        name: form.name.trim(),
        description: form.description.trim()
      });
      setForm({ name: "", description: "" });
      await loadEvents();
    } catch (err) {
      setError(err.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <div className="hero-title">Events</div>
          <div className="hero-subtitle">
            Create, track, and manage community events in one place.
          </div>
          <div className="hero-meta">
            <span className="meta-pill">
              Total <strong>{events.length}</strong>
            </span>
            <span className="meta-pill">
              Admin roles <strong>{adminCount}</strong>
            </span>
            <span className="meta-pill">
              Manager roles <strong>{managerCount}</strong>
            </span>
          </div>
        </div>
        <div className="hero-actions">
          <Link to="/events/new" className="btn primary">
            Create Event
          </Link>
          <Link to="/events/new" className="btn ghost">
            Advanced Form
          </Link>
        </div>
      </section>

      <section className="page-grid">
        <div className="stack">
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">Quick create</div>
                <div className="panel-subtitle">
                  Start an event in under 30 seconds.
                </div>
              </div>
            </div>
            <form className="form" onSubmit={handleCreate}>
              <label className="field">
                <span>Event name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ambedkar Jayanti 2026"
                  required
                />
              </label>
              <label className="field">
                <span>Description</span>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Short description"
                />
              </label>
              <div className="form-actions">
                <button
                  className="btn primary"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create event"}
                </button>
              </div>
            </form>
          </div>

          <div className="panel panel-muted">
            <div className="panel-header">
              <div>
                <div className="panel-title">Your snapshot</div>
                <div className="panel-subtitle">Roles and memberships</div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-label">Total memberships</div>
                <div className="stat-value">{events.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Admin roles</div>
                <div className="stat-value">{adminCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Manager roles</div>
                <div className="stat-value">{managerCount}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Your events</div>
              <div className="panel-subtitle">
                Access everything you’re a part of.
              </div>
            </div>
          </div>
          <div className="grid event-grid">
            {loading ? <div className="card">Loading events...</div> : null}
            {error ? <div className="card error">{error}</div> : null}
            {!loading && !events.length ? (
              <div className="card muted">
                No events yet. Create your first event.
              </div>
            ) : null}
            {events.map((membership) => (
              <Link
                key={membership.id}
                to={`/events/${membership.event.id}`}
                className="card clickable"
              >
                <div className="card-title">{membership.event.name}</div>
                <div className="card-meta">
                  Role: <strong>{membership.role}</strong>
                </div>
                <div className="card-desc">
                  {membership.event.description || "No description yet."}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
