import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-[50vh] flex items-center justify-center text-slate-500 font-hud">Verifying your session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/tournaments" replace />;
  return children;
}
