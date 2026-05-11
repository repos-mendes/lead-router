import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "gestor" | "coordenador" | "adm" | "sdr" | "corretor";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: Role;
  cidadeId?: string;
  empreendimentoIds?: string[];
}

interface AuthCtx {
  user: AuthUser | null;
  login: (email: string, role: Role, cidadeId?: string, nome?: string, empreendimentoIds?: string[]) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "leadflow_user";

export const ROLE_LABEL: Record<Role, string> = {
  gestor: "Gestor",
  coordenador: "Coordenador",
  adm: "ADM de Expansão",
  sdr: "SDR",
  corretor: "Corretor",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const login = (email: string, role: Role, cidadeId?: string, nome?: string, empreendimentoIds?: string[]) => {
    const u: AuthUser = {
      id: crypto.randomUUID(),
      nome: nome ?? email.split("@")[0].replace(/\./g, " "),
      email,
      role,
      cidadeId,
      empreendimentoIds,
    };
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setUser(null);
  };

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
