import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) return <Navigate to="/" />;

  // Force password change if required
  if (user.needs_password_change && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" />;
  }

  // Prevent accessing change-password if not required
  if (!user.needs_password_change && location.pathname === "/change-password") {
    return <Navigate to="/" />; // Or determinstic dashboard path
  }

  if (role && user.role !== role) return <Navigate to="/unauthorized" />;

  return children;
};

export default ProtectedRoute;
