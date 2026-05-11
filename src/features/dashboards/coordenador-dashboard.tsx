import { PageHeader, StatCard } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { loadLeads, loadUsers, loadEmpreendimentos } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Inbox, Clock, Users } from "lucide-react";

export function CoordenadorDashboard() {
  const { user } = useAuth();
  const empIds = user?.empreendimentoIds ?? [];

  const allLeads = loadLeads();
  const allUsers = loadUsers();

  const todosEmpreendimentos = loadEmpreendimentos();
  const semFiltro = empIds.length === 0;
  const meusEmpreendimentos = semFiltro
    ? todosEmpreendimentos
    : todosEmpreendimentos.filter((e) => empIds.includes(e.id));
  const empNomes = new Set(meusEmpreendimentos.map((e) => e.nome));

  const leadsDosMeusEmp = semFiltro
    ? allLeads
    : allLeads.filter((l) => empNomes.has(l.empreendimento));

  const leadsAguardandoAdm = leadsDosMeusEmp.filter((l) => l.status === "aguardando").length;

  const corretores = allUsers.filter(
    (u) => u.role === "corretor" && (semFiltro || empIds.some((id) => u.empreendimentoIds?.includes(id)))
  );

  const leadsPorEmpreendimento = meusEmpreendimentos.map((e) => ({
    nome: e.nome.length > 18 ? e.nome.slice(0, 16) + "…" : e.nome,
    leads: leadsDosMeusEmp.filter((l) => l.empreendimento === e.nome).length,
  }));

  const leadsPorCorretor = corretores
    .map((c) => {
      const meus = leadsDosMeusEmp.filter((l) => l.corretorNome === c.nome);
      return {
        nome: c.nome,
        total: meus.length,
        aguardandoAcao: meus.filter((l) => l.status === "distribuido").length,
        leadsAceitos: meus.filter((l) => l.status === "em_atendimento").length,
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageHeader title="Dashboard" description="Acompanhamento dos seus empreendimentos." />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard
          title="Leads recebidos (SDR → ADM)"
          value={leadsDosMeusEmp.length}
          icon={<Inbox className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Aguardando distribuição pelo ADM"
          value={leadsAguardandoAdm}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Corretores vinculados"
          value={corretores.length}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Leads por empreendimento</CardTitle></CardHeader>
        <CardContent>
          {leadsPorEmpreendimento.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum empreendimento vinculado.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={leadsPorEmpreendimento} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="nome" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="leads" name="Leads" fill="oklch(0.52 0.18 256)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Leads por corretor</CardTitle></CardHeader>
        <CardContent className="p-0">
          {leadsPorCorretor.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              Nenhum corretor vinculado aos seus empreendimentos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Corretor</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Aguardando ação</TableHead>
                  <TableHead className="text-center">Leads Aceitos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsPorCorretor.map((c) => (
                  <TableRow key={c.nome}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{c.total}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-orange-600 border-orange-200">{c.aguardandoAcao}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-blue-600 border-blue-200">{c.leadsAceitos}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
