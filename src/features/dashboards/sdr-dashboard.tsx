import { Link } from "@tanstack/react-router";
import { PageHeader, StatCard, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { loadLeads, cidadeNome } from "@/lib/mock-data";
import { UserPlus, Inbox, CheckCircle2, Clock } from "lucide-react";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

export function SdrDashboard() {
  const { user } = useAuth();
  const all = loadLeads();
  const meus = all
    .filter((l) => l.sdrNome === user?.nome)
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  const distribuidos = meus.filter((l) => l.status !== "aguardando").length;
  const aguardando = meus.filter((l) => l.status === "aguardando").length;

  return (
    <div>
      <PageHeader
        title="Painel do SDR"
        description="Cadastre novos leads qualificados pelo BotMaker."
        action={
          <Button asChild>
            <Link to="/app/leads/new">
              <UserPlus className="h-4 w-4 mr-2" />Cadastrar Lead
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="visao-geral">
        <TabsList className="mb-4">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="historico">
            Histórico ({meus.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Leads cadastrados"
              value={meus.length}
              icon={<Inbox className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Distribuídos"
              value={distribuidos}
              icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            />
            <StatCard
              title="Aguardando ADM"
              value={aguardando}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            {meus.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Você ainda não cadastrou nenhum lead.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead className="hidden md:table-cell">Cidade</TableHead>
                    <TableHead className="hidden lg:table-cell">Empreendimento</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Cadastrado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meus.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="font-medium">{l.nome}</div>
                        <div className="text-xs text-muted-foreground">{l.telefone}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {cidadeNome(l.cidadeId)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {l.empreendimento}
                      </TableCell>
                      <TableCell className="text-sm">
                        {l.destinatarioNome ?? l.corretorNome ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={l.status} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(l.criadoEm)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
