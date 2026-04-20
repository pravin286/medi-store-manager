import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { UserResponseRole } from "@workspace/api-client-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserResponseRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/owner/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect based on their role if they try to access something they shouldn't
    if (user.role === "admin") {
      return <Redirect to="/admin/dashboard" />;
    } else {
      return <Redirect to="/owner/dashboard" />;
    }
  }

  return <>{children}</>;
}
