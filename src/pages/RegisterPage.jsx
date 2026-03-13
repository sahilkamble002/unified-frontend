import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await register(form);
      setSuccess("Account created. Please log in.");
      setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      setError(err.message || "Registration failed");
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
          <div className="auth-headline">Build your event workspace.</div>
          <div className="auth-subline">
            Invite members, assign tasks, and track every rupee with control.
          </div>
        </div>
        <div className="auth-badges">
          <span className="auth-badge">Members</span>
          <span className="auth-badge">Assignments</span>
          <span className="auth-badge">Donations</span>
          <span className="auth-badge">Audit</span>
        </div>
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-title">Create your account</div>
          <div className="auth-subtitle">
            Register to start managing your events.
          </div>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              required
            />
          </label>
          <label className="field">
            <span>Username</span>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="unique.username"
              required
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="field">
            <span>Phone</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
            />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          {success ? <div className="form-success">{success}</div> : null}
          <button className="btn primary" type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create account"}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
