import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { DateRange } from "react-day-picker";
import { PageHeader, StatCard, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { loadLeads, saveLeads, loadUsers, loadEmpreendimentos, type Lead } from "@/lib/mock-data";
import {
  UserPlus,
  Inbox,
  CheckCircle2,
  Clock,
  RefreshCw,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Filtro de datas ─────────────────────────────────────────────────────────

type Periodo = "hoje" | "ontem" | "7d" | "30d" | "90d" | "todos" | "personalizado";

const PRESETS: { value: Exclude<Periodo, "personalizado">; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "todos", label: "Todo o período" },
];

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function endOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}
function fmtBR(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function filtrarLeads(leads: Lead[], periodo: Periodo, range: DateRange | undefined): Lead[] {
  const hoje = startOfDay(new Date());
  if (periodo === "personalizado") {
    if (!range?.from) return leads;
    const de = startOfDay(range.from);
    const ate = endOfDay(range.to ?? range.from);
    return leads.filter((l) => {
      const d = new Date(l.criadoEm);
      return d >= de && d <= ate;
    });
  }
  if (periodo === "ontem") {
    const de = new Date(hoje.getTime() - 86400000);
    return leads.filter((l) => {
      const d = new Date(l.criadoEm);
      return d >= de && d < hoje;
    });
  }
  const inicio: Date | null = (() => {
    switch (periodo) {
      case "hoje":
        return hoje;
      case "7d":
        return new Date(hoje.getTime() - 6 * 86400000);
      case "30d":
        return new Date(hoje.getTime() - 29 * 86400000);
      case "90d":
        return new Date(hoje.getTime() - 89 * 86400000);
      default:
        return null;
    }
  })();
  return inicio ? leads.filter((l) => new Date(l.criadoEm) >= inicio!) : leads;
}

function labelFiltro(periodo: Periodo, range: DateRange | undefined): string {
  if (periodo === "personalizado" && range?.from) {
    return range.to ? `${fmtBR(range.from)} – ${fmtBR(range.to)}` : fmtBR(range.from);
  }
  return PRESETS.find((p) => p.value === periodo)?.label ?? "Período";
}

function FiltroData({
  periodo,
  setPeriodo,
  range,
  setRange,
}: {
  periodo: Periodo;
  setPeriodo: (p: Periodo) => void;
  range: DateRange | undefined;
  setRange: (r: DateRange | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 text-sm font-normal">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {labelFiltro(periodo, range)}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="flex flex-col gap-0.5 p-2 border-r min-w-[140px]">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setPeriodo(p.value);
                  setRange(undefined);
                  setOpen(false);
                }}
                className={cn(
                  "text-left text-sm px-3 py-1.5 rounded-md hover:bg-accent whitespace-nowrap transition-colors",
                  periodo === p.value && "bg-accent font-medium",
                )}
              >
                {p.label}
              </button>
            ))}
            {periodo === "personalizado" && (
              <button
                className="text-left text-sm px-3 py-1.5 rounded-md bg-accent font-medium whitespace-nowrap mt-0.5"
                onClick={() => setOpen(false)}
              >
                Personalizado
              </button>
            )}
          </div>
          <Calendar
            mode="range"
            selected={range}
            onSelect={(r) => {
              setRange(r ?? undefined);
              setPeriodo("personalizado");
              if (r?.from && r?.to) setOpen(false);
            }}
            disabled={{ after: new Date() }}
            className="p-3"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function SdrDashboard() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>(() => loadLeads());
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [range, setRange] = useState<DateRange | undefined>();
  const [selected, setSelected] = useState<Lead | null>(null);
  const [novoEmp, setNovoEmp] = useState("");
  const [destinatarioId, setDestinatarioId] = useState("");

  const meus = leads
    .filter((l) => l.sdrNome === user?.nome)
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  const meusFiltrados = filtrarLeads(meus, periodo, range);
  const distribuidos = meusFiltrados.filter((l) => l.status !== "aguardando").length;
  const aguardando = meusFiltrados.filter((l) => l.status === "aguardando").length;

  const todosEmpreendimentos = loadEmpreendimentos().filter((e) => e.status === "ativo");
  const empreendimentos = user?.empreendimentoIds?.length
    ? todosEmpreendimentos.filter((e) => user.empreendimentoIds!.includes(e.id))
    : todosEmpreendimentos;

  const allUsers = loadUsers();
  const selectedEmp = todosEmpreendimentos.find((e) => e.nome === novoEmp);
  const adms = allUsers.filter(
    (u) =>
      u.role === "adm" &&
      (!selectedEmp || (u.empreendimentoIds?.includes(selectedEmp.id) ?? false)),
  );
  const corretores = allUsers.filter(
    (u) =>
      u.role === "corretor" &&
      (!selectedEmp || (u.empreendimentoIds?.includes(selectedEmp.id) ?? false)),
  );
  const destinatarioSelecionado = [...adms, ...corretores].find((u) => u.id === destinatarioId);

  const abrirReatribuir = (lead: Lead) => {
    setSelected(lead);
    setNovoEmp(lead.empreendimento);
    setDestinatarioId(lead.destinatarioId ?? lead.corretorId ?? "");
  };

  const fecharDialog = () => {
    setSelected(null);
    setNovoEmp("");
    setDestinatarioId("");
  };

  const confirmarReatribuicao = () => {
    if (!selected || !destinatarioSelecionado || !novoEmp) return;
    const isCorretor = destinatarioSelecionado.role === "corretor";
    const updated = leads.map((l) =>
      l.id === selected.id
        ? {
            ...l,
            empreendimento: novoEmp,
            status: isCorretor ? ("distribuido" as const) : ("aguardando" as const),
            corretorId: isCorretor ? destinatarioSelecionado.id : undefined,
            corretorNome: isCorretor ? destinatarioSelecionado.nome : undefined,
            destinatarioId: destinatarioSelecionado.id,
            destinatarioNome: destinatarioSelecionado.nome,
          }
        : l,
    );
    saveLeads(updated);
    setLeads(updated);
    toast.success(`Lead reatribuído para ${destinatarioSelecionado.nome}.`);
    fecharDialog();
  };

  return (
    <div>
      <PageHeader
        title="Painel do SDR"
        description="Cadastre novos leads qualificados pelo BotMaker."
        action={
          <Button asChild>
            <Link to="/app/leads/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar Lead
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="visao-geral">
        <TabsList className="mb-4">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({meus.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <div className="flex items-center justify-end mb-4">
            <FiltroData
              periodo={periodo}
              setPeriodo={setPeriodo}
              range={range}
              setRange={setRange}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Leads cadastrados"
              value={meusFiltrados.length}
              hint={labelFiltro(periodo, range)}
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
                    <TableHead className="hidden md:table-cell">Empreendimento</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meus.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="font-medium">{l.nome}</div>
                        <div className="text-xs text-muted-foreground">{l.telefone}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{l.empreendimento}</TableCell>
                      <TableCell className="text-sm">
                        {l.destinatarioNome ?? l.corretorNome ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={l.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => abrirReatribuir(l)}>
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          Reatribuir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) fecharDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reatribuir lead</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md border p-3 space-y-1 bg-muted/40">
                <p>
                  <span className="text-muted-foreground">Lead:</span>{" "}
                  <span className="font-medium">{selected.nome}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Telefone:</span> {selected.telefone}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Empreendimento</Label>
                <Select
                  value={novoEmp}
                  onValueChange={(v) => {
                    setNovoEmp(v);
                    setDestinatarioId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o empreendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {empreendimentos.map((e) => (
                      <SelectItem key={e.id} value={e.nome}>
                        {e.nome}
                        {e.cidade ? ` — ${e.cidade}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destinatário</Label>
                <Select
                  value={destinatarioId}
                  onValueChange={setDestinatarioId}
                  disabled={!novoEmp}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        novoEmp
                          ? "Selecione corretor ou ADM"
                          : "Selecione o empreendimento primeiro"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {adms.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          ADMs de Expansão
                        </div>
                        {adms.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.nome}
                          </SelectItem>
                        ))}
                        {corretores.length > 0 && <SelectSeparator />}
                      </>
                    )}
                    {corretores.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Corretores
                        </div>
                        {corretores.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.nome}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {adms.length === 0 && corretores.length === 0 && (
                      <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        Nenhum usuário vinculado a este empreendimento.
                      </div>
                    )}
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={fecharDialog}>
              Cancelar
            </Button>
            <Button onClick={confirmarReatribuicao} disabled={!novoEmp || !destinatarioId}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
