import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { loadEmpreendimentos, saveEmpreendimentos, type Empreendimento } from "@/lib/mock-data";
import { Plus, List, Pencil, PowerOff, Power } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/empreendimentos")({
  component: EmpreendimentosPage,
});

function parseLote(texto: string): { nome: string; cidade: string }[] {
  return texto
    .split("\n")
    .map((line) => {
      const idx = line.indexOf(",");
      if (idx === -1) return { nome: line.trim(), cidade: "" };
      return { nome: line.slice(0, idx).trim(), cidade: line.slice(idx + 1).trim() };
    })
    .filter((r) => r.nome.length > 0);
}

function EmpreendimentosPage() {
  const { user } = useAuth();
  const [lista, setLista] = useState<Empreendimento[]>(loadEmpreendimentos);

  const [openNovo, setOpenNovo] = useState(false);
  const [novoForm, setNovoForm] = useState({ nome: "", cidade: "" });

  const [openLote, setOpenLote] = useState(false);
  const [loteTexto, setLoteTexto] = useState("");
  const loteLinhas = parseLote(loteTexto);

  const [editando, setEditando] = useState<Empreendimento | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", cidade: "" });

  if (!user) return <Navigate to="/login" />;
  if (user.role !== "gestor") return <Navigate to="/app" />;

  const persist = (atualizado: Empreendimento[]) => {
    setLista(atualizado);
    saveEmpreendimentos(atualizado);
  };

  const criar = () => {
    if (!novoForm.nome.trim()) return;
    const novo: Empreendimento = {
      id: crypto.randomUUID(),
      nome: novoForm.nome.trim(),
      cidade: novoForm.cidade.trim(),
      status: "ativo",
      criadoEm: new Date().toISOString(),
    };
    persist([novo, ...lista]);
    toast.success(`"${novo.nome}" cadastrado.`);
    setOpenNovo(false);
    setNovoForm({ nome: "", cidade: "" });
  };

  const criarLote = () => {
    if (loteLinhas.length === 0) return;
    const novos: Empreendimento[] = loteLinhas.map(({ nome, cidade }) => ({
      id: crypto.randomUUID(),
      nome,
      cidade,
      status: "ativo",
      criadoEm: new Date().toISOString(),
    }));
    persist([...novos, ...lista]);
    toast.success(`${novos.length} empreendimento${novos.length > 1 ? "s" : ""} cadastrado${novos.length > 1 ? "s" : ""}.`);
    setOpenLote(false);
    setLoteTexto("");
  };

  const abrirEdicao = (e: Empreendimento) => {
    setEditando(e);
    setEditForm({ nome: e.nome, cidade: e.cidade });
  };

  const salvarEdicao = () => {
    if (!editando || !editForm.nome.trim()) return;
    persist(lista.map((e) =>
      e.id === editando.id ? { ...e, nome: editForm.nome.trim(), cidade: editForm.cidade.trim() } : e
    ));
    toast.success(`"${editForm.nome.trim()}" atualizado.`);
    setEditando(null);
  };

  const toggleStatus = (id: string) => {
    const atualizado = lista.map((e) =>
      e.id === id ? { ...e, status: e.status === "ativo" ? ("inativo" as const) : ("ativo" as const) } : e
    );
    persist(atualizado);
    const emp = atualizado.find((e) => e.id === id)!;
    toast(emp.status === "ativo" ? `"${emp.nome}" reativado.` : `"${emp.nome}" desativado.`);
  };

  const ativos = lista.filter((e) => e.status === "ativo").length;
  const inativos = lista.filter((e) => e.status === "inativo").length;

  return (
    <div>
      <PageHeader
        title="Empreendimentos"
        description="Gerencie os produtos disponíveis para distribuição de leads."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpenLote(true)}>
              <List className="h-4 w-4 mr-2" />Cadastro em massa
            </Button>
            <Button onClick={() => setOpenNovo(true)}>
              <Plus className="h-4 w-4 mr-2" />Novo
            </Button>
          </div>
        }
      />

      <div className="flex gap-3 mb-4">
        <Badge variant="secondary" className="bg-green-100 text-green-800">{ativos} ativos</Badge>
        <Badge variant="secondary" className="bg-muted text-muted-foreground">{inativos} inativos</Badge>
      </div>

      <Card>
        {lista.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum empreendimento cadastrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((e) => (
                <TableRow key={e.id} className={e.status === "inativo" ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{e.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{e.cidade || "—"}</TableCell>
                  <TableCell>
                    {e.status === "ativo"
                      ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
                      : <Badge variant="secondary">Inativo</Badge>
                    }
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => abrirEdicao(e)} title="Editar">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleStatus(e.id)}
                      title={e.status === "ativo" ? "Desativar" : "Reativar"}>
                      {e.status === "ativo"
                        ? <PowerOff className="h-4 w-4 text-muted-foreground" />
                        : <Power className="h-4 w-4 text-green-600" />
                      }
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Dialog: novo */}
      <Dialog open={openNovo} onOpenChange={setOpenNovo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo empreendimento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Residencial Aurora"
                value={novoForm.nome}
                onChange={(e) => setNovoForm({ ...novoForm, nome: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && criar()}
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                placeholder="Ex: São Paulo"
                value={novoForm.cidade}
                onChange={(e) => setNovoForm({ ...novoForm, cidade: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && criar()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={criar} disabled={!novoForm.nome.trim()}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: cadastro em massa */}
      <Dialog open={openLote} onOpenChange={setOpenLote}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Cadastro em massa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Uma entrada por linha no formato <span className="font-mono">Nome, Cidade</span>.
              A cidade é opcional.
            </p>
            <Textarea
              rows={10}
              placeholder={"Residencial Aurora, São Paulo\nVista Mar, Rio de Janeiro\nTorre Platinum, Curitiba"}
              value={loteTexto}
              onChange={(e) => setLoteTexto(e.target.value)}
              className="font-mono text-sm"
            />
            {loteLinhas.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="py-2">Nome</TableHead>
                      <TableHead className="py-2">Cidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loteLinhas.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="py-1.5 text-sm">{r.nome}</TableCell>
                        <TableCell className="py-1.5 text-sm text-muted-foreground">{r.cidade || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenLote(false)}>Cancelar</Button>
            <Button onClick={criarLote} disabled={loteLinhas.length === 0}>
              Cadastrar {loteLinhas.length > 0 ? loteLinhas.length : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: editar */}
      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar empreendimento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && salvarEdicao()}
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                placeholder="Ex: São Paulo"
                value={editForm.cidade}
                onChange={(e) => setEditForm({ ...editForm, cidade: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && salvarEdicao()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={!editForm.nome.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
