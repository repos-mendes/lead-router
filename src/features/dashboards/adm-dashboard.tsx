import { Link } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cidadeNome, loadLeads, MOCK_USERS } from "@/lib/mock-data";
import { Inbox, Users, ArrowRight } from "lucide-react";

export function AdmDashboard() {
  const { user } = useAuth();
  const leads = loadLeads().filter((l) => l.cidadeId === user?.cidadeId);
  const aguardando = leads.filter((l) => l.status === "aguardando").length;
  const corretores = MOCK_USERS.filter((u) => u.role === "corretor" && u.cidadeId === user?.cidadeId);

  return (
    <div>
      <PageHeader
        title={`ADM — ${cidadeNome(user?.cidadeId)}`}
        description="Distribua os leads recebidos para sua equipe local."
        action={<Button asChild><Link to="/app/distribution">Ir para distribuição<ArrowRight className="h-4 w-4 ml-2" /></Link></Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Aguardando distribuição" value={aguardando} icon={<Inbox className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Leads totais (cidade)" value={leads.length} />
        <StatCard title="Corretores na praça" value={corretores.length} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
      </div>
    </div>
  );
}
