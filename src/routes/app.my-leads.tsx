import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadLeads, saveLeads, type Lead, type LeadStatus } from "@/lib/mock-data";
import {
  Copy, MessageCircle, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Clock, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/my-leads")({
  component: MyLeads,
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function MyLeads() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "corretor") return <Navigate to="/app" />;

  const [leads, setLeads] = useState<Lead[]>(() =>
    loadLeads().filter((l) => l.corretorId === user.id)
  );
  const [historicoAberto, setHistoricoAberto] = useState(false);

  const novos = leads
    .filter((l) => l.status === "distribuido" || (l.status === "aguardando" && !!l.corretorId))
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  const atendimento = leads
    .filter((l) => l.status === "em_atendimento")
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  const historico = leads
    .filter((l) => l.status === "contato_feito" || l.status === "numero_invalido")
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  const mudarStatus = (id: string, status: LeadStatus) => {
    const all = loadLeads().map((l) => (l.id === id ? { ...l, status } : l));
    saveLeads(all);
    setLeads(all.filter((l) => l.corretorId === user.id));
  };

  const aceitar = (id: string) => {
    mudarStatus(id, "em_atendimento");
    toast.success("Lead aceito! Contato liberado.");
  };

  const copy = (tel: string) => {
    navigator.clipboard.writeText(tel);
    toast.success("Telefone copiado.");
  };

  const whatsapp = (tel: string) => {
    window.open(`https://wa.me/55${tel.replace(/\D/g, "")}`, "_blank");
  };

  const converter = (id: string) => {
    mudarStatus(id, "contato_feito");
    toast.success("Contato feito registrado!");
  };

  const perder = (id: string) => {
    mudarStatus(id, "numero_invalido");
    toast("Número inválido registrado.");
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Meus Leads" description="Sua fila de trabalho." />

      {/* Aguardando ação */}
      <section>
        <div className="flex items-center gap-2 border-b pb-2 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Aguardando ação
          </h2>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
            {novos.length}
          </span>
        </div>

        {novos.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-1">Nenhum lead novo no momento.</p>
        ) : (
          <div className="grid gap-3">
            {novos.map((l) => (
              <Card
                key={l.id}
                className="p-4 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      <span className="font-semibold">{l.nome}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 ml-4">
                      {l.empreendimento}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 ml-4">
                      <Clock className="h-3 w-3" /> {timeAgo(l.criadoEm)}
                    </p>
                  </div>
                  <Button size="sm" className="shrink-0" onClick={() => aceitar(l.id)}>
                    Aceitar Lead
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-3 pt-3 border-t border-orange-200 dark:border-orange-900">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  Aceite o lead para ver o contato do cliente.
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Em atendimento */}
      <section>
        <div className="flex items-center gap-2 border-b pb-2 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Lead Aceito
          </h2>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {atendimento.length}
          </span>
        </div>

        {atendimento.length === 0 ? (
          <p className="text-sm text-muted-foreground pl-1">Parabéns, você entrou em contato com todos os seus leads!</p>
        ) : (
          <div className="grid gap-3">
            {atendimento.map((l) => (
              <Card key={l.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{l.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {l.empreendimento}
                    </p>
                    <p className="text-sm font-mono mt-1">{l.telefone}</p>
                    {l.notas && (
                      <p className="text-xs text-muted-foreground italic mt-1">{l.notas}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {timeAgo(l.criadoEm)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" onClick={() => whatsapp(l.telefone)}>
                      <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copy(l.telefone)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
                    onClick={() => converter(l.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Contato Feito
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-700 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => perder(l.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Número Inválido
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Histórico */}
      <section>
        <button
          className="flex items-center gap-2 border-b pb-2 mb-3 w-full text-left hover:opacity-70 transition-opacity"
          onClick={() => setHistoricoAberto((v) => !v)}
        >
          {historicoAberto
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          }
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Histórico
          </h2>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {historico.length}
          </span>
        </button>

        {historicoAberto && (
          historico.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-1">Nenhum lead no histórico ainda.</p>
          ) : (
            <div className="grid gap-2">
              {historico.map((l) => (
                <Card key={l.id} className="p-3 opacity-60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{l.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.empreendimento} · {timeAgo(l.criadoEm)}
                      </p>
                      <p className="text-xs font-mono mt-1">{l.telefone}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(l.telefone)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <StatusBadge status={l.status} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </section>
    </div>
  );
}
