import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { loadUsers } from "@/lib/mock-data";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  if (user) return <Navigate to="/app" />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const found = loadUsers().find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.senha === senha
    );
    if (!found) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    login(found.id, found.email, found.role, found.nome, found.empreendimentoIds);
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted px-4">
      <div className="flex-1 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl">LeadFlow</CardTitle>
              <CardDescription>Gestão de Leads Imobiliários</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </CardContent>
      </Card>
      </div>
      <p className="text-xs text-muted-foreground text-center pb-4">Development by LM</p>
    </div>
  );
}
