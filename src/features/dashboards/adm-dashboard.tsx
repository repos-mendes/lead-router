import { Link } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { loadLeads, loadUsers, loadEmpreendimentos } from "@/lib/mock-data";
import { Inbox, Users, ArrowRight } from "lucide-react";

export function AdmDashboard() {
  const { user } = useAuth();
  const empIds = user?.empreendimentoIds ?? [];
  const empNomes = new Set(
    loadEmpreendimentos().filter((e) => empIds.includes(e.id)).map((e) => e.nome)
  );
  const leads = loadLeads().filter((l) => empNomes.has(l.empreendimento));
  const aguardando = leads.filter((l) => l.status === "aguardando").length;
  const corretores = loadUsers().filter(
    (u) => u.role === "corretor" && empIds.some((id) => u.empreendimentoIds?.includes(id))
  );

  return (
    <div>
      <PageHeader
        title="ADM de Expansão"
        description="Distribua os leads recebidos para sua equipe local."
        action={<Button asChild><Link to="/app/distribution">Ir para distribuição<ArrowRight className="h-4 w-4 ml-2" /></Link></Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Aguardando distribuição" value={aguardando} icon={<Inbox className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Leads totais (seus empreendimentos)" value={leads.length} />
        <StatCard title="Corretores na equipe" value={corretores.length} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
      </div>
    </div>
  );
}
