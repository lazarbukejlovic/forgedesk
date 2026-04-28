import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading admin…
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="max-w-md">
          <p className="eyebrow">403</p>
          <h1 className="mt-3 font-display text-4xl tracking-tightest">Admins only.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This area is restricted. Sign in with an admin account to continue.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};
