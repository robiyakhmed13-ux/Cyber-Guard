import { Navigate, useLocation } from "react-router-dom";
import { usePhase3Auth } from "@/context/Phase3AuthContext";
import { Shield } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isHydrated } = usePhase3Auth();
  const location = useLocation();

  // Wait for localStorage session to be restored before deciding to redirect
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Shield className="h-5 w-5 text-primary animate-pulse" />
          <span className="font-mono text-sm animate-pulse">Checking session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
