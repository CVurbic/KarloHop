import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading, user } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/hop-upravljanje" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
