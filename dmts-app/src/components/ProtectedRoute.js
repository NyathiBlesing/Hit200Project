import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const role = localStorage.getItem("role"); 
  console.log("User Role:", role); 

  if (!role) {
    console.log("No role found, redirecting to login...");
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    console.log(`Role ${role} not allowed, redirecting to login...`);
    return <Navigate to="/login" replace />;
  }

  return children; 
};

export default ProtectedRoute;
