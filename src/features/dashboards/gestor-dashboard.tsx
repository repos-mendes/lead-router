import { Link } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Inbox, TrendingUp, Building, Clock, PhoneCall } from "lucide-react";
import { loadLeads, loadEmpreendimentos, MOCK_USERS } from "@/lib/mock-data";

export function GestorDashboard() {
  const leads = loadLeads();
  const empreendimentosAtivos = loadEmpreendimentos().filter((e) => e.status === "ativo");
  const aguardandoAdm = leads.filter((l) => l.status === "aguardando").length;
  const aguardandoCorretor = leads.filter((l) => l.status === "distribuido").length;
  const emAtendimento = leads.filter((l) => l.status === "em_atendimento").length;
  const contatoFeito = leads.filter((l) => l.status === "contato_feito").length;

  return (
    <div>
      <PageHeader
        title="Visão Geral — Gestor"
        description="Controle total da operação em todas as 15 expansões."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/app/users">Gerenciar usuários</Link></Button>
            <Button asChild><Link to="/app/leads/new"><UserPlus className="h-4 w-4 mr-2" />Novo Lead</Link></Button>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <StatCard title="Total de Leads" value={leads.length} hint="Todos os tempos" icon={<Inbox className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Aguardando ADM" value={aguardandoAdm} hint="Fila do ADM" icon={<Clock className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Aguardando Corretor" value={aguardandoCorretor} hint="Fila do corretor" icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Lead Aceito" value={emAtendimento} hint="Corretor ativo" icon={<PhoneCall className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Contato Feito" value={contatoFeito} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Empreendimentos ativos</CardTitle></CardHeader>
          <CardContent>
            {empreendimentosAtivos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum empreendimento ativo.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {empreendimentosAtivos.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 p-2 rounded-md border">
                    <Building className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.nome}</p>
                      {e.cidade && <p className="text-xs text-muted-foreground truncate">{e.cidade}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Equipe</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              {MOCK_USERS.slice(0, 6).map((u) => (
                <li key={u.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <span>{u.nome}</span>
                  <span className="text-xs text-muted-foreground capitalize">{u.role}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
