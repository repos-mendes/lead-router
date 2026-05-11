import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { GestorDashboard } from "@/features/dashboards/gestor-dashboard";
import { CoordenadorDashboard } from "@/features/dashboards/coordenador-dashboard";
import { AdmDashboard } from "@/features/dashboards/adm-dashboard";
import { SdrDashboard } from "@/features/dashboards/sdr-dashboard";
import { CorretorDashboard } from "@/features/dashboards/corretor-dashboard";

export const Route = createFileRoute("/app/")({
  component: AppIndex,
});

function AppIndex() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  switch (user.role) {
    case "gestor": return <GestorDashboard />;
    case "coordenador": return <CoordenadorDashboard />;
    case "adm": return <AdmDashboard />;
    case "sdr": return <SdrDashboard />;
    case "corretor": return <CorretorDashboard />;
  }
}
