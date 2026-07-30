import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  loadLeads,
  loadUsers,
  loadEmpreendimentos,
  saveLeads,
  type Lead,
  type MockUser,
} from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/distribution")({
  component: Distribution,
});

function Distribution() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>(loadLeads());
  const [selected, setSelected] = useState<Lead | null>(null);
  const [destinatarioId, setDestinatarioId] = useState<string>("");
  const allUsers = loadUsers();

  if (!user) return <Navigate to="/login" />;
  if (user.role !== "adm" && user.role !== "gestor") return <Navigate to="/app" />;

  const isGestor = user.role === "gestor";

  const meusEmpNomes = isGestor
    ? null
    : (() => {
        const emps = loadEmpreendimentos();
        return new Set(
          emps.filter((e) => user.empreendimentoIds?.includes(e.id)).map((e) => e.nome),
        );
      })();

  const visiveis = meusEmpNomes ? leads.filter((l) => meusEmpNomes.has(l.empreendimento)) : leads;

  const aguardando = visiveis.filter((l) => l.status === "aguardando");
  const comCorretores = visiveis.filter(
    (l) => l.status === "distribuido" || l.status === "em_atendimento",
  );
  const encerrados = visiveis.filter(
    (l) => l.status === "contato_feito" || l.status === "numero_invalido",
  );

  const adms = allUsers.filter((u) => u.role === "adm");
  const admEmpIds = isGestor ? null : (user.empreendimentoIds ?? []);
  const corretores = allUsers.filter((u) => {
    if (u.role !== "corretor") return false;
    if (isGestor) return true;
    return admEmpIds!.some((id) => u.empreendimentoIds?.includes(id));
  });
  const destinatarioSelecionado = [...adms, ...corretores].find((u) => u.id === destinatarioId);

  const atribuir = () => {
    if (!selected || !destinatarioSelecionado) return;
    const isCorretor = destinatarioSelecionado.role === "corretor";
    const updated = leads.map((l) =>
      l.id === selected.id
        ? {
            ...l,
            status: isCorretor ? ("distribuido" as const) : ("aguardando" as const),
            corretorId: isCorretor ? destinatarioSelecionado.id : undefined,
            corretorNome: isCorretor ? destinatarioSelecionado.nome : undefined,
            destinatarioId: destinatarioSelecionado.id,
            destinatarioNome: destinatarioSelecionado.nome,
          }
        : l,
    );
    setLeads(updated);
    saveLeads(updated);
    toast.success(`Lead atribuído a ${destinatarioSelecionado.nome}.`);
    setSelected(null);
    setDestinatarioId("");
  };

  return (
    <div>
      <PageHeader
        title="Distribuição de Leads"
        description={isGestor ? "Todas as expansões" : "Seus empreendimentos"}
      />

      <Tabs defaultValue="aguardando">
        <TabsList>
          <TabsTrigger value="aguardando">Aguardando ({aguardando.length})</TabsTrigger>
          <TabsTrigger value="corretores">Com Corretores ({comCorretores.length})</TabsTrigger>
          {isGestor && (
            <TabsTrigger value="encerrados">Encerrados ({encerrados.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="aguardando">
          <Card>
            <LeadsTable
              leads={aguardando}
              responsavelLabel="Com ADM"
              getResponsavel={(l) => l.destinatarioNome ?? "—"}
              actionLabel="Atribuir"
              onAction={(l) => {
                setSelected(l);
                setDestinatarioId("");
              }}
              users={allUsers}
            />
          </Card>
        </TabsContent>

        <TabsContent value="corretores">
          <Card>
            <LeadsTable
              leads={comCorretores}
              responsavelLabel="Corretor"
              getResponsavel={(l) => l.corretorNome ?? "—"}
              actionLabel={isGestor ? "Reatribuir" : undefined}
              onAction={
                isGestor
                  ? (l) => {
                      setSelected(l);
                      setDestinatarioId("");
                    }
                  : undefined
              }
              users={allUsers}
            />
          </Card>
        </TabsContent>

        {isGestor && (
          <TabsContent value="encerrados">
            <Card>
              <LeadsTable
                leads={encerrados}
                responsavelLabel="Corretor"
                getResponsavel={(l) => l.corretorNome ?? "—"}
                users={allUsers}
              />
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setDestinatarioId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir lead</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="rounded-md border p-3 space-y-1 bg-muted/40">
                <p>
                  <span className="text-muted-foreground">Lead:</span>{" "}
                  <span className="font-medium">{selected.nome}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Telefone:</span> {selected.telefone}
                </p>
                <p>
                  <span className="text-muted-foreground">Empreendimento:</span>{" "}
                  {selected.empreendimento}
                </p>
                <p>
                  <span className="text-muted-foreground">Responsável atual:</span>{" "}
                  {selected.destinatarioNome ?? selected.corretorNome ?? "—"}
                </p>
              </div>
              <Select value={destinatarioId} onValueChange={setDestinatarioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo destino" />
                </SelectTrigger>
                <SelectContent>
                  {isGestor && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        ADMs de Expansão
                      </div>
                      {adms.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Corretores
                      </div>
                    </>
                  )}
                  {corretores.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {destinatarioSelecionado && (
                <p className="text-xs text-muted-foreground">
                  {destinatarioSelecionado.role === "corretor"
                    ? "Lead vai direto para a fila do corretor."
                    : "Lead vai para a fila de distribuição do ADM."}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelected(null);
                setDestinatarioId("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={atribuir} disabled={!destinatarioId}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeadsTable({
  leads,
  responsavelLabel,
  getResponsavel,
  actionLabel,
  onAction,
  users,
}: {
  leads: Lead[];
  responsavelLabel: string;
  getResponsavel: (l: Lead) => string;
  actionLabel?: string;
  onAction?: (l: Lead) => void;
  users: MockUser[];
}) {
  if (leads.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Nenhum lead.</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead className="hidden lg:table-cell">Empreendimento</TableHead>
          <TableHead>{responsavelLabel}</TableHead>
          <TableHead>Status</TableHead>
          {actionLabel && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((l) => {
          const responsavel = getResponsavel(l);
          const responsavelUser = users.find(
            (u) => u.id === l.destinatarioId || u.id === l.corretorId || u.nome === responsavel,
          );
          const isAdm = responsavelUser?.role === "adm";
          return (
            <TableRow key={l.id}>
              <TableCell>
                <div className="font-medium">{l.nome}</div>
                <div className="text-xs text-muted-foreground">{l.telefone}</div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">{l.empreendimento}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{responsavel}</span>
                  {responsavel !== "—" && (
                    <Badge variant="outline" className="text-xs">
                      {isAdm ? "ADM" : "Corretor"}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={l.status} />
              </TableCell>
              {actionLabel && (
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => onAction?.(l)}>
                    {actionLabel}
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
