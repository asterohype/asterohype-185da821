import { Navigate } from "react-router-dom";

export default function AdminCollections() {
  return <Navigate to="/admin?tab=collections" replace />;
}
