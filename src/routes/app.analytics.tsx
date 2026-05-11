import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { CoordenadorDashboard } from "@/features/dashboards/coordenador-dashboard";

export const Route = createFileRoute("/app/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "gestor" && user.role !== "coordenador") return <Navigate to="/app" />;
  return <CoordenadorDashboard />;
}
