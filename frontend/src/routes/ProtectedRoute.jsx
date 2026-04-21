// PrivateRoute.jsx
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isAdmin = Boolean(token) && role === "Admin";
  return isAdmin ? children : <Navigate to="/admin/login" />;
}
