import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { label: "Events", to: "/events" },
  { label: "Create Event", to: "/events/new" },
  { label: "Notifications", to: "/notifications" }
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(
    () => localStorage.getItem("erp_theme") || "light"
  );

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem("erp_theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <div className="rail-brand">
          <span className="brand-mark">ERP</span>
          <div>
            <div className="brand-title">Event Manager</div>
            <div className="brand-subtitle">Community Workspace</div>
          </div>
        </div>

        <nav className="rail-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "rail-link active" : "rail-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="rail-footer">
          <button className="btn rail-btn" onClick={toggleTheme}>
            {theme === "light" ? "Night Mode" : "Day Mode"}
          </button>
          <button className="btn rail-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div>
            <div className="topbar-title">Workspace</div>
            <div className="topbar-subtitle">
              Organize events, members, tasks, and finance in one place.
            </div>
          </div>
          <div className="topbar-actions">
            <span className="status-pill">Layer 6 Live</span>
            <div className="user-chip">
              <div className="user-avatar">{user?.name?.[0] || "U"}</div>
              <div>
                <div className="user-name">{user?.name || "User"}</div>
                <div className="user-email">
                  {user?.username ? `@${user.username}` : user?.email || ""}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
