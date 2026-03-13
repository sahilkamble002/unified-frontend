import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as eventsApi from "../api/events.js";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    donationUpiId: "",
    fundingGoal: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await eventsApi.createEvent({
        name: form.name.trim(),
        description: form.description.trim(),
        donationUpiId: form.donationUpiId.trim() || null,
        fundingGoal: form.fundingGoal === "" ? null : Number(form.fundingGoal)
      });
      navigate(`/events/${data.id}`);
    } catch (err) {
      setError(err.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Create new event</h2>
            <p>Start a new community event and invite members.</p>
          </div>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Event name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ganesh Utsav 2026"
              required
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Purpose, venue, theme, or timing"
              rows="4"
            />
          </label>
          <label className="field">
            <span>Donation UPI ID</span>
            <input
              name="donationUpiId"
              value={form.donationUpiId}
              onChange={handleChange}
              placeholder="example@upi"
            />
          </label>
          <label className="field">
            <span>Funding Goal</span>
            <input
              name="fundingGoal"
              type="number"
              min="0"
              value={form.fundingGoal}
              onChange={handleChange}
              placeholder="50000"
            />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <div className="form-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => navigate("/events")}
            >
              Cancel
            </button>
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create event"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
