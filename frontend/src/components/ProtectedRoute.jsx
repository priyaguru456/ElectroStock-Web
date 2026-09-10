import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleToSlug } from "../utils/roleSlug";

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const { role: roleParam } = useParams();

  if (loading) {
    return <div className="page-loading">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const ownSlug = roleToSlug(user.role);

  if (roleParam && roleParam !== ownSlug) {
    return <Navigate to={`/${ownSlug}/dashboard`} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${ownSlug}/dashboard`} replace />;
  }

  return <Outlet />;
}
