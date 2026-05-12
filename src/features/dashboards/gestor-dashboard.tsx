import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { DateRange } from "react-day-picker";
import { PageHeader, StatCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, UserPlus, Inbox, TrendingUp, Building, Clock, PhoneCall, CalendarDays, ChevronDown } from "lucide-react";
import { loadLeads, loadEmpreendimentos, loadUsers, type Lead } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

// ─── Tipos e helpers de data ────────────────────────────────────────────────

type Periodo = "hoje" | "ontem" | "7d" | "30d" | "90d" | "todos" | "personalizado";

const PRESETS: { value: Exclude<Periodo, "personalizado">; label: string }[] = [
  { value: "hoje",  label: "Hoje" },
  { value: "ontem", label: "Ontem" },
  { value: "7d",    label: "Últimos 7 dias" },
  { value: "30d",   label: "Últimos 30 dias" },
  { value: "90d",   label: "Últimos 90 dias" },
  { value: "todos", label: "Todo o período" },
];

function startOfDay(d: Date) {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
}
function endOfDay(d: Date) {
  const r = new Date(d); r.setHours(23, 59, 59, 999); return r;
}
function fmtBR(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function filtrarLeads(leads: Lead[], periodo: Periodo, range: DateRange | undefined): Lead[] {
  const hoje = startOfDay(new Date());

  if (periodo === "personalizado") {
    if (!range?.from) return leads;
    const de  = startOfDay(range.from);
    const ate = endOfDay(range.to ?? range.from);
    return leads.filter((l) => { const d = new Date(l.criadoEm); return d >= de && d <= ate; });
  }
  if (periodo === "ontem") {
    const de  = new Date(hoje.getTime() - 86400000);
    return leads.filter((l) => { const d = new Date(l.criadoEm); return d >= de && d < hoje; });
  }

  const inicio: Date | null = (() => {
    switch (periodo) {
      case "hoje": return hoje;
      case "7d":   return new Date(hoje.getTime() - 6  * 86400000);
      case "30d":  return new Date(hoje.getTime() - 29 * 86400000);
      case "90d":  return new Date(hoje.getTime() - 89 * 86400000);
      default:     return null;
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

// ─── Componente do filtro ────────────────────────────────────────────────────

function FiltroData({
  periodo, setPeriodo, range, setRange,
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
                onClick={() => { setPeriodo(p.value); setRange(undefined); setOpen(false); }}
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

// ─── Dashboard principal ─────────────────────────────────────────────────────

export function GestorDashboard() {
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [range, setRange] = useState<DateRange | undefined>();

  const leads = loadLeads();
  const empreendimentos = loadEmpreendimentos();
  const empreendimentosAtivos = empreendimentos.filter((e) => e.status === "ativo");
  const allUsers = loadUsers();

  const leadsFiltrados = filtrarLeads(leads, periodo, range);

  const aguardandoAdm      = leadsFiltrados.filter((l) => l.status === "aguardando").length;
  const aguardandoCorretor = leadsFiltrados.filter((l) => l.status === "distribuido").length;
  const emAtendimento      = leadsFiltrados.filter((l) => l.status === "em_atendimento").length;
  const contatoFeito       = leadsFiltrados.filter((l) => l.status === "contato_feito").length;

  const leadsPorEmpreendimento = empreendimentosAtivos.map((e) => ({
    nome: e.nome.length > 18 ? e.nome.slice(0, 16) + "…" : e.nome,
    leads: leadsFiltrados.filter((l) => l.empreendimento === e.nome).length,
  }));

  const corretores = allUsers.filter((u) => u.role === "corretor");
  const leadsPorCorretor = corretores
    .map((c) => {
      const meus = leadsFiltrados.filter((l) => l.corretorId === c.id);
      return {
        nome: c.nome,
        total:         meus.length,
        aguardandoAcao: meus.filter((l) => l.status === "distribuido").length,
        leadsAceitos:   meus.filter((l) => l.status === "em_atendimento").length,
        contatoFeito:   meus.filter((l) => l.status === "contato_feito").length,
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <PageHeader
        title="Visão Geral — Gestor"
        description="Controle total da operação."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link to="/app/users">Gerenciar usuários</Link></Button>
            <Button asChild><Link to="/app/leads/new"><UserPlus className="h-4 w-4 mr-2" />Novo Lead</Link></Button>
          </div>
        }
      />

      <div className="flex items-center justify-end mb-4">
        <FiltroData periodo={periodo} setPeriodo={setPeriodo} range={range} setRange={setRange} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <StatCard title="Total de Leads"       value={leadsFiltrados.length} hint={labelFiltro(periodo, range)} icon={<Inbox  className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Aguardando ADM"       value={aguardandoAdm}         icon={<Clock    className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Aguardando Corretor"  value={aguardandoCorretor}    icon={<Users    className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Lead Aceito"          value={emAtendimento}         icon={<PhoneCall className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Contato Feito"        value={contatoFeito}          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Leads por empreendimento</CardTitle></CardHeader>
        <CardContent>
          {leadsPorEmpreendimento.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum empreendimento ativo.</p>
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

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Leads por corretor</CardTitle></CardHeader>
        <CardContent className="p-0">
          {leadsPorCorretor.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Nenhum corretor cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Corretor</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Aguardando ação</TableHead>
                  <TableHead className="text-center">Lead Aceito</TableHead>
                  <TableHead className="text-center">Contato Feito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadsPorCorretor.map((c) => (
                  <TableRow key={c.nome}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary">{c.total}</Badge></TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="text-orange-600 border-orange-200">{c.aguardandoAcao}</Badge></TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="text-blue-600 border-blue-200">{c.leadsAceitos}</Badge></TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="text-green-600 border-green-200">{c.contatoFeito}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
            {allUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {allUsers.slice(0, 6).map((u) => (
                  <li key={u.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span>{u.nome}</span>
                    <span className="text-xs text-muted-foreground capitalize">{u.role}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
