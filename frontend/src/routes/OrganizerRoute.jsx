import { Navigate } from "react-router-dom";

export default function OrganizerRoute({ children }) {
  const token = localStorage.getItem("organizerToken");
  return token ? children : <Navigate to="/organizer/login" />;
}
