
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface AdminRouteProps {
  children: React.ReactElement;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user } = useAuth();

  const role = String(user?.role || "")
    .trim()
    .toLowerCase();

  const isAdmin = [
    "admin",
    "superadmin",
    "super_admin",
    "administrator",
  ].includes(role);

  useEffect(() => {
    console.log("AdminRoute - User:", user);
    console.log("AdminRoute - Role:", role);
    console.log("AdminRoute - Is Admin:", isAdmin);
  }, [user, role, isAdmin]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

