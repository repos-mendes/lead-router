export interface Cidade {
  id: string;
  nome: string;
}

export const CIDADES: Cidade[] = [
  { id: "sp", nome: "São Paulo" },
  { id: "rj", nome: "Rio de Janeiro" },
  { id: "bh", nome: "Belo Horizonte" },
  { id: "cur", nome: "Curitiba" },
  { id: "poa", nome: "Porto Alegre" },
  { id: "bsb", nome: "Brasília" },
  { id: "sal", nome: "Salvador" },
  { id: "rec", nome: "Recife" },
  { id: "for", nome: "Fortaleza" },
  { id: "man", nome: "Manaus" },
  { id: "goi", nome: "Goiânia" },
  { id: "cps", nome: "Campinas" },
  { id: "san", nome: "Santos" },
  { id: "flor", nome: "Florianópolis" },
  { id: "vit", nome: "Vitória" },
];

export type TipoEmpreendimento = "Residencial" | "Comercial" | "Misto";

export interface Empreendimento {
  id: string;
  nome: string;
  cidade: string;
  status: "ativo" | "inativo";
  criadoEm: string;
}

const EMP_KEY = "leadflow_empreendimentos";
const EMP_VERSION_KEY = "leadflow_empreendimentos_version";
const EMP_VERSION = "v3";

export function loadEmpreendimentos(): Empreendimento[] {
  if (typeof window === "undefined") return [];
  try {
    if (localStorage.getItem(EMP_VERSION_KEY) !== EMP_VERSION) {
      localStorage.removeItem(EMP_KEY);
      localStorage.setItem(EMP_VERSION_KEY, EMP_VERSION);
    }
    const raw = localStorage.getItem(EMP_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveEmpreendimentos(list: Empreendimento[]) {
  localStorage.setItem(EMP_KEY, JSON.stringify(list));
}

export type LeadStatus = "aguardando" | "distribuido" | "em_atendimento" | "contato_feito" | "numero_invalido";

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  cidadeId: string;
  empreendimento: string;
  notas?: string;
  status: LeadStatus;
  sdrNome: string;
  corretorNome?: string;
  destinatarioNome?: string;
  criadoEm: string;
}

export interface MockUser {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: "gestor" | "coordenador" | "adm" | "sdr" | "corretor";
  cidadeId?: string;
  empreendimentoIds?: string[];
}

const USER_KEY = "leadflow_users";
const USER_VERSION_KEY = "leadflow_users_version";
const USER_VERSION = "v3";

export function loadUsers(): MockUser[] {
  if (typeof window === "undefined") return [];
  try {
    if (localStorage.getItem(USER_VERSION_KEY) !== USER_VERSION) {
      localStorage.removeItem(USER_KEY);
      localStorage.setItem(USER_VERSION_KEY, USER_VERSION);
    }
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUsers(users: MockUser[]) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

export const MOCK_USERS: MockUser[] = [];

const STORE_KEY = "leadflow_leads";
const SEED_VERSION = "v4";
const VERSION_KEY = "leadflow_seed_version";

export function loadLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    if (localStorage.getItem(VERSION_KEY) !== SEED_VERSION) {
      localStorage.removeItem(STORE_KEY);
      localStorage.setItem(VERSION_KEY, SEED_VERSION);
    }
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLeads(leads: Lead[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(leads));
}

export function cidadeNome(id?: string) {
  return CIDADES.find((c) => c.id === id)?.nome ?? "—";
}
