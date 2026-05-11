import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, ROLE_LABEL, type Role } from "@/lib/auth";
import { PageHeader } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CIDADES, MOCK_USERS, loadUsers, saveUsers, loadEmpreendimentos, type MockUser } from "@/lib/mock-data";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/users")({
  component: UsersPage,
});

const ROLES_COM_EMPREENDIMENTO: Role[] = ["corretor", "adm", "coordenador"];

function EmpreendimentosCell({ ids, allNames }: { ids?: string[]; allNames: Record<string, string> }) {
  if (!ids || ids.length === 0) return <span className="text-muted-foreground">—</span>;
  const nomes = ids.map((id) => allNames[id]).filter(Boolean);
  if (nomes.length === 0) return <span className="text-muted-foreground">—</span>;
  const visiveis = nomes.slice(0, 2);
  const resto = nomes.length - visiveis.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visiveis.map((n) => <Badge key={n} variant="outline" className="text-xs">{n}</Badge>)}
      {resto > 0 && <Badge variant="secondary" className="text-xs">+{resto}</Badge>}
    </div>
  );
}

function EmpreendimentosCheckboxes({
  empIds,
  onChange,
}: {
  empIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const empreendimentos = loadEmpreendimentos();
  const toggle = (id: string, checked: boolean) => {
    onChange(checked ? [...empIds, id] : empIds.filter((x) => x !== id));
  };
  return (
    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
      {empreendimentos.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum empreendimento cadastrado.</p>
      )}
      {empreendimentos.map((e) => (
        <div key={e.id} className="flex items-center gap-2">
          <Checkbox
            id={`emp-${e.id}`}
            checked={empIds.includes(e.id)}
            onCheckedChange={(v) => toggle(e.id, !!v)}
          />
          <label htmlFor={`emp-${e.id}`} className="text-sm cursor-pointer select-none">
            {e.nome}
            {e.status === "inativo" && (
              <span className="ml-1 text-xs text-muted-foreground">(inativo)</span>
            )}
          </label>
        </div>
      ))}
    </div>
  );
}

function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<MockUser[]>(() => loadUsers());
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<MockUser | null>(null);
  const [editEmpIds, setEditEmpIds] = useState<string[]>([]);
  const [deleteUser, setDeleteUser] = useState<MockUser | null>(null);
  const [form, setForm] = useState({
    nome: "", email: "", senha: "", role: "sdr" as Role, cidadeId: "", empreendimentoIds: [] as string[],
  });

  const empNames: Record<string, string> = Object.fromEntries(
    loadEmpreendimentos().map((e) => [e.id, e.nome])
  );

  if (!user) return <Navigate to="/login" />;
  if (user.role !== "gestor") return <Navigate to="/app" />;

  const setFormRole = (role: Role) => {
    setForm((f) => ({
      ...f,
      role,
      cidadeId: ROLES_COM_EMPREENDIMENTO.includes(role) ? f.cidadeId : "",
      empreendimentoIds: ROLES_COM_EMPREENDIMENTO.includes(role) ? f.empreendimentoIds : [],
    }));
  };

  const create = () => {
    if (!form.nome || !form.email || !form.senha) return;
    const u: MockUser = {
      id: crypto.randomUUID(),
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      role: form.role,
      cidadeId: form.cidadeId || undefined,
      empreendimentoIds: ROLES_COM_EMPREENDIMENTO.includes(form.role)
        ? form.empreendimentoIds
        : undefined,
    };
    const updated = [u, ...users];
    setUsers(updated);
    saveUsers(updated);
    toast.success("Usuário criado.");
    setOpen(false);
    setForm({ nome: "", email: "", senha: "", role: "sdr", cidadeId: "", empreendimentoIds: [] });
  };

  const openEdit = (u: MockUser) => {
    setEditUser(u);
    setEditEmpIds(u.empreendimentoIds ?? []);
  };

  const confirmDelete = () => {
    if (!deleteUser) return;
    const updated = users.filter((u) => u.id !== deleteUser.id);
    setUsers(updated);
    saveUsers(updated);
    toast.success(`${deleteUser.nome} foi removido.`);
    setDeleteUser(null);
  };

  const saveEdit = () => {
    if (!editUser) return;
    const updated = users.map((u) =>
      u.id === editUser.id ? { ...u, empreendimentoIds: editEmpIds } : u
    );
    setUsers(updated);
    saveUsers(updated);
    toast.success("Empreendimentos atualizados.");
    setEditUser(null);
  };

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerencie quem tem acesso à plataforma."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo usuário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar usuário</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select value={form.role} onValueChange={(v) => setFormRole(v as Role)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(form.role === "adm" || form.role === "corretor") && (
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Select value={form.cidadeId} onValueChange={(v) => setForm({ ...form, cidadeId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {CIDADES.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {ROLES_COM_EMPREENDIMENTO.includes(form.role) && (
                  <div className="space-y-2">
                    <Label>Empreendimentos vinculados</Label>
                    <EmpreendimentosCheckboxes
                      empIds={form.empreendimentoIds}
                      onChange={(ids) => setForm({ ...form, empreendimentoIds: ids })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={create}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Empreendimentos</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant="secondary">{ROLE_LABEL[u.role]}</Badge></TableCell>
                <TableCell>
                  {ROLES_COM_EMPREENDIMENTO.includes(u.role)
                    ? <EmpreendimentosCell ids={u.empreendimentoIds} allNames={empNames} />
                    : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {ROLES_COM_EMPREENDIMENTO.includes(u.role) && (
                      <Button size="icon" variant="ghost" onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {u.email !== user.email && (
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteUser(u)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!deleteUser} onOpenChange={(o) => { if (!o) setDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteUser?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Empreendimentos — {editUser?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Empreendimentos vinculados</Label>
            <EmpreendimentosCheckboxes empIds={editEmpIds} onChange={setEditEmpIds} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
