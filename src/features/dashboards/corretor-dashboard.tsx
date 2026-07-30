import { Link } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ListChecks } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { loadLeads } from "@/lib/mock-data";

export function CorretorDashboard() {
  const { user } = useAuth();
  const meus = loadLeads().filter((l) => l.corretorId === user?.id);

  return (
    <div>
      <PageHeader
        title={`Olá, ${user?.nome}`}
        description="Sua fila de trabalho do dia."
        action={
          <Button asChild>
            <Link to="/app/my-leads">
              <ListChecks className="h-4 w-4 mr-2" />
              Ver meus leads
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Aguardando ação"
          value={
            meus.filter(
              (l) => l.status === "distribuido" || (l.status === "aguardando" && !!l.corretorId),
            ).length
          }
        />
        <StatCard
          title="Leads aceitos"
          value={
            meus.filter((l) =>
              ["em_atendimento", "contato_feito", "numero_invalido"].includes(l.status),
            ).length
          }
        />
        <StatCard
          title="Contatos feitos"
          value={meus.filter((l) => l.status === "contato_feito").length}
        />
      </div>
      <p className="text-sm text-muted-foreground mt-6">
        Acesse{" "}
        <Link to="/app/my-leads" className="underline">
          Meus Leads
        </Link>{" "}
        para iniciar o contato pelo WhatsApp.
      </p>
    </div>
  );
}
