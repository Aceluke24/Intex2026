import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  requiredRole?: "Admin" | "Donor";
}

export function ProtectedRoute({ requiredRole }: Props) {
  const { user, loading, isAdmin, isDonor } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-muted-foreground font-body text-sm">Loading…</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole === "Admin" && !isAdmin) return <Navigate to="/unauthorized" replace />;
  if (requiredRole === "Donor" && !isDonor && !isAdmin) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
