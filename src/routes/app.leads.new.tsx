import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { MOCK_USERS, cidadeNome, loadLeads, saveLeads, loadEmpreendimentos, type Lead } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/leads/new")({
  component: NewLead,
});

function NewLead() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "", telefone: "", cidadeId: "sp", empreendimento: "", notas: "",
  });
  const [destinatarioId, setDestinatarioId] = useState<string>("");
  const todosEmpreendimentos = loadEmpreendimentos().filter((e) => e.status === "ativo");
  const empreendimentos = user?.empreendimentoIds?.length
    ? todosEmpreendimentos.filter((e) => user.empreendimentoIds!.includes(e.id))
    : todosEmpreendimentos;

  if (!user) return <Navigate to="/login" />;
  if (user.role !== "sdr" && user.role !== "gestor") return <Navigate to="/app" />;

  const adms = MOCK_USERS.filter((u) => u.role === "adm");
  const corretores = MOCK_USERS.filter((u) => u.role === "corretor");
  const destinatarioSelecionado = [...adms, ...corretores].find((u) => u.id === destinatarioId);

  const handleDestinatario = (id: string) => {
    const pessoa = [...adms, ...corretores].find((u) => u.id === id);
    setDestinatarioId(id);
    if (pessoa?.cidadeId) {
      setForm((f) => ({ ...f, cidadeId: pessoa.cidadeId! }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinatarioSelecionado) return;

    const isCorretor = destinatarioSelecionado.role === "corretor";
    const lead: Lead = {
      id: crypto.randomUUID(),
      nome: form.nome,
      telefone: form.telefone,
      cidadeId: form.cidadeId,
      empreendimento: form.empreendimento,
      notas: form.notas,
      status: isCorretor ? "distribuido" : "aguardando",
      sdrNome: user.nome,
      corretorNome: isCorretor ? destinatarioSelecionado.nome : undefined,
      destinatarioNome: destinatarioSelecionado.nome,
      criadoEm: new Date().toISOString(),
    };

    saveLeads([lead, ...loadLeads()]);
    toast.success(
      isCorretor
        ? `Lead enviado diretamente para ${destinatarioSelecionado.nome}.`
        : `Lead encaminhado para o ADM ${destinatarioSelecionado.nome}.`
    );
    navigate({ to: "/app" });
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Cadastrar Novo Lead" description="Preencha os dados qualificados pelo BotMaker." />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-0000" />
              </div>
              <div className="space-y-2">
                <Label>Empreendimento</Label>
                <Select required value={form.empreendimento} onValueChange={(v) => setForm({ ...form, empreendimento: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o empreendimento" /></SelectTrigger>
                  <SelectContent>
                    {empreendimentos.map((e) => (
                      <SelectItem key={e.id} value={e.nome}>
                        {e.nome}{e.cidade ? ` — ${e.cidade}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destinatário</Label>
                <Select required value={destinatarioId} onValueChange={handleDestinatario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione corretor ou ADM" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      ADMs de Expansão
                    </div>
                    {adms.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome} — {cidadeNome(u.cidadeId)}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Corretores
                    </div>
                    {corretores.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome} — {cidadeNome(u.cidadeId)}
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
            </div>
            <div className="space-y-2">
              <Label>Observações da qualificação</Label>
              <Textarea rows={4} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/app" })}>Cancelar</Button>
              <Button type="submit" disabled={!destinatarioId}>Salvar lead</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
