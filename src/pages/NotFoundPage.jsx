import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="page">
      <div className="card">
        <div className="card-title">Page not found</div>
        <p className="card-desc">
          The page you are looking for does not exist.
        </p>
        <Link to="/" className="btn ghost">
          Go home
        </Link>
      </div>
    </div>
  );
}
