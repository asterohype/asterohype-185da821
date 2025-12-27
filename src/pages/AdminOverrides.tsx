import { Navigate } from "react-router-dom";

export default function AdminOverrides() {
  return <Navigate to="/admin?tab=overrides" replace />;
}
