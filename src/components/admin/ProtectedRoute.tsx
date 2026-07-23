import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

type Role = "admin" | "radnik";

const ProtectedRoute = ({
  children,
  allow = ["admin"],
}: {
  children: React.ReactNode;
  allow?: Role[];
}) => {
  const { isAdmin, isRadnik, loading, user } = useAdmin();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  const hasAccess = (allow.includes("admin") && isAdmin) || (allow.includes("radnik") && isRadnik);

  if (!user || !hasAccess) {
    return <Navigate to="/hop-upravljanje" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
