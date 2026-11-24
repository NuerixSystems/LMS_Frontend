
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface AdminRouteProps {
  children: React.ReactElement;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
}) => {
  const { user, adminToken, isLoading } = useAuth();

  // Wait until saved authentication is restored.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user.role || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const isAdminRole = [
    "admin",
    "superadmin",
    "super_admin",
    "administrator",
  ].includes(role);

  // Both admin role and CRM admin token are required.
  if (!isAdminRole || !adminToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
