import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container-editorial py-32 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
};
