import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "username" ? value.toLowerCase() : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login({
        ...form,
        username: form.username.trim().toLowerCase()
      });
      navigate("/events");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-brand">
          <span className="brand-mark">ERP</span>
          <div>
            <div className="brand-title">Community ERP</div>
            <div className="brand-subtitle">Event Operations Hub</div>
          </div>
        </div>
        <div className="auth-copy">
          <div className="auth-headline">
            Run events like a command center.
          </div>
          <div className="auth-subline">
            Coordinate members, tasks, and finance with clarity.
          </div>
        </div>
        <div className="auth-badges">
          <span className="auth-badge">Events</span>
          <span className="auth-badge">Tasks</span>
          <span className="auth-badge">Finance</span>
          <span className="auth-badge">Reports</span>
        </div>
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-title">Welcome back</div>
          <div className="auth-subtitle">Login to manage events and tasks.</div>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="your.username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <small>Usernames are matched in lowercase automatically.</small>
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              required
            />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="btn primary" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="auth-footer">
          New here? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
