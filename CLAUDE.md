# LeadRouter — Guia do Projeto

## O que é este projeto

CRM de leads imobiliários chamado **LeadRouter** (antes "Lead Flow Pro"; repositório `lead-router`). Gerencia o fluxo de clientes interessados em imóveis, do primeiro contato até a venda, com dashboards diferentes por perfil de usuário.

## Stack tecnológica

| Tecnologia           | Versão | Uso                           |
| -------------------- | ------ | ----------------------------- |
| TypeScript           | ~5.8   | Linguagem principal           |
| React                | 19     | Framework de UI               |
| TanStack Start       | ~1.167 | SSR e servidor                |
| TanStack Router      | ~1.168 | Roteamento por arquivos       |
| TanStack Query       | ~5.83  | Gerenciamento de estado/dados |
| Tailwind CSS         | v4     | Estilização                   |
| shadcn/ui + Radix UI | —      | Componentes prontos           |
| Vite                 | 7      | Build tool                    |
| Bun                  | 1.3.13 | Package manager e runtime     |
| Cloudflare Workers   | —      | Plataforma de deploy          |

## Como rodar

```bash
bun install       # instala dependências
bun run dev       # servidor de desenvolvimento em localhost:5173
bun run build     # build para Cloudflare Workers
```

## Estrutura de pastas

```
src/
├── routes/                  # Páginas (cada arquivo = uma URL)
│   ├── __root.tsx           # Raiz da aplicação (meta tags, providers globais)
│   ├── index.tsx            # Redireciona / → /app
│   ├── login.tsx            # Tela de login (email + senha, autentica via localStorage)
│   ├── app.tsx              # Layout principal (sidebar + header) com guarda de auth
│   ├── app.index.tsx        # Dashboard (muda conforme o perfil do usuário)
│   ├── app.leads.new.tsx         # Formulário de novo lead (SDR seleciona destinatário)
│   ├── app.distribution.tsx      # Distribuição de leads — ADM (seus empreendimentos) e Gestor (tudo)
│   ├── app.my-leads.tsx          # Fila do corretor: Aguardando ação / Lead Aceito / Histórico
│   ├── app.users.tsx             # Gerenciamento de usuários (só Gestor)
│   └── app.empreendimentos.tsx   # CRUD de empreendimentos (só Gestor)
│
├── features/dashboards/     # Dashboards separados por perfil
│   ├── gestor-dashboard.tsx
│   ├── coordenador-dashboard.tsx
│   ├── adm-dashboard.tsx
│   ├── sdr-dashboard.tsx
│   └── corretor-dashboard.tsx
│
├── components/
│   ├── app-sidebar.tsx      # Sidebar de navegação
│   ├── shared.tsx           # Componentes reutilizáveis (PageHeader, StatCard, StatusBadge)
│   └── ui/                  # Componentes shadcn/ui (gerados, não editar manualmente)
│
├── hooks/
│   └── use-mobile.tsx       # Hook para detectar viewport mobile
│
├── lib/
│   ├── auth.tsx             # Context de autenticação (localStorage)
│   ├── mock-data.ts         # CRUD via localStorage (sem seeds — banco começa vazio)
│   ├── utils.ts             # Utilitários (cn para classes)
│   ├── error-capture.ts     # Captura de erros SSR
│   └── error-page.ts        # Página de erro SSR
│
├── routeTree.gen.ts         # Gerado automaticamente pelo TanStack Router — NÃO editar
├── router.tsx               # Configuração do router (QueryClient + routeTree)
├── server.ts                # Entry point do Cloudflare Workers (wrapper SSR)
├── start.ts                 # Entry point do cliente
└── styles.css               # Estilos globais (Tailwind)
```

## Perfis de usuário (Roles)

| Role          | Label na UI     | Acesso                                                                                     |
| ------------- | --------------- | ------------------------------------------------------------------------------------------ |
| `gestor`      | Gestor          | Visão total — todos os leads, gerencia usuários e empreendimentos, reatribui qualquer lead |
| `coordenador` | Coordenador     | Métricas e acompanhamento dos seus empreendimentos (read-only)                             |
| `adm`         | ADM de Expansão | Recebe leads do SDR e distribui para corretores dos seus empreendimentos                   |
| `sdr`         | SDR             | Cadastra novos leads e escolhe o destinatário (corretor ou ADM)                            |
| `corretor`    | Corretor        | Aceita leads da sua fila e registra o resultado do contato                                 |

- `adm`, `corretor` e `coordenador` têm `empreendimentoIds` — vinculados a empreendimentos específicos
- `gestor` não tem `empreendimentoIds` — vê tudo automaticamente (tratado com flag `semFiltro`)

## Fluxo de leads

```
SDR cadastra lead
  └─ escolhe destinatário (filtrado pelos empreendimentos do SDR)
       ├─ Corretor → status "distribuido", corretorNome preenchido
       └─ ADM     → status "aguardando",  destinatarioNome preenchido

ADM (ou Gestor) distribui via /app/distribution
  └─ atribui a Corretor → status "distribuido"
  └─ reatribui a outro ADM → status "aguardando"
  (ADM só vê corretores que compartilham os mesmos empreendimentos)

Corretor acessa /app/my-leads
  └─ clica "Aceitar Lead" → status "em_atendimento" (contato revelado)
       ├─ "Contato Feito"   → status "contato_feito"
       └─ "Número Inválido" → status "numero_invalido"
```

**Regra defensiva:** leads com `status "aguardando"` e `corretorNome` preenchido também aparecem na fila do corretor (dados corrompidos não ficam invisíveis).

## Status e cores

| Valor interno     | Label           | Cor badge |
| ----------------- | --------------- | --------- |
| `aguardando`      | Aguardando      | Âmbar     |
| `distribuido`     | Aguardando ação | Laranja   |
| `em_atendimento`  | Lead Aceito     | Azul      |
| `contato_feito`   | Contato Feito   | Verde     |
| `numero_invalido` | Número Inválido | Vermelho  |

Definidos em `src/components/shared.tsx` → `StatusBadge`. Mesmas cores usadas em todas as dashboards.

## Dados e autenticação

- **Sem banco de dados real** — todos os dados ficam no `localStorage` do navegador
- **Auth por email + senha** — login autentica contra `loadUsers()` comparando email e senha em texto puro
- `login()` recebe `nome` explícito para garantir que `corretorNome === user.nome` funcione na filtragem de leads
- Banco começa vazio — sem seeds. Primeiro usuário deve ser criado via console do navegador (ver abaixo)
- Dados são perdidos se o localStorage for limpo
- As chaves do localStorage mantêm o prefixo `leadflow_` do nome antigo **de propósito**: renomeá-las apagaria os dados de quem já usa o app
- Tema (dark/light) é persistido em `leadflow_theme` no localStorage; toggle fica no header do layout

### Criando o primeiro usuário (gestor)

Abrir o console do navegador (F12) e colar:

```js
localStorage.setItem("leadflow_users_version", "v3");
localStorage.setItem(
  "leadflow_users",
  JSON.stringify([
    {
      id: crypto.randomUUID(),
      nome: "Seu Nome",
      email: "seu@email.com",
      senha: "suasenha",
      role: "gestor",
    },
  ]),
);
```

Após recarregar a página, logar com o email e senha definidos. A partir daí, criar outros usuários pela tela de Usuários da plataforma.

### Estrutura de dados principais

**MockUser:** `id, nome, email, senha, role, empreendimentoIds?`

- `loadUsers()` / `saveUsers()` — chave `leadflow_users`, versão `v3`

**Lead:** `id, nome, telefone, empreendimento, notas?, status, sdrNome, corretorId?, corretorNome?, destinatarioId?, destinatarioNome?, criadoEm`

- `loadLeads()` / `saveLeads()` — chave `leadflow_leads`, versão `v5`

**Empreendimento:** `id, nome, cidade (texto livre), status ("ativo"|"inativo"), criadoEm`

- `loadEmpreendimentos()` / `saveEmpreendimentos()` — chave `leadflow_empreendimentos`, versão `v3`

### Versionamento do seed (localStorage)

| Chave                              | Versão atual | Limpa quando                   |
| ---------------------------------- | ------------ | ------------------------------ |
| `leadflow_users_version`           | `v3`         | schema de usuários muda        |
| `leadflow_seed_version`            | `v5`         | schema de leads muda           |
| `leadflow_empreendimentos_version` | `v3`         | schema de empreendimentos muda |

Ao trocar a versão no código, o localStorage é limpo automaticamente no próximo carregamento.

## Configuração do Vite (`vite.config.ts`)

```ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({ server: { entry: "server" } }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
```

**Importante:** `@cloudflare/vite-plugin` foi removido intencionalmente. Quando incluído, ele faz o TanStack Start gerar um manifesto com `clientEntry: "/@id/virtual:tanstack-start-client-entry"` (referência de módulo virtual do dev-mode do Vite), causando página em branco na produção. Sem o plugin, o build gera `dist/server/server.js` com manifesto correto, e o wrangler bundlea as dependências na etapa de deploy.

## Deploy — Cloudflare Workers

### Configuração (`wrangler.jsonc`)

```json
{
  "name": "tanstack-start-app",
  "compatibility_date": "2025-09-24",
  "compatibility_flags": ["nodejs_compat"],
  "main": "dist/server/server.js",
  "assets": { "directory": "dist/client" }
}
```

- `main` aponta para o output do build (`dist/server/server.js`), não para o source
- `assets` serve os arquivos estáticos do cliente (`dist/client/`)
- Sem `no_bundle: true` — o wrangler bundlea todas as dependências npm no Worker

### Deploy manual

```bash
bun run build
bunx wrangler deploy
```

### Deploy automático (CI/CD)

Qualquer `git push` na branch `main` dispara o GitHub Actions (`.github/workflows/deploy.yml`), que executa build e deploy automaticamente. As credenciais do Cloudflare ficam nos GitHub Secrets (`CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`) — nunca no código.

### URL de produção

`https://tanstack-start-app.lucas-mendes-044.workers.dev`

## Path alias

`@/` mapeia para `src/` (configurado no `tsconfig.json` e resolvido pelo `vite-tsconfig-paths`).

```ts
import { useAuth } from "@/lib/auth"; // → src/lib/auth.tsx
```

## Roadmap: migração para produção

> Deploy realizado com dados em localStorage. Próximas etapas para tornar o CRM real.

### Arquitetura alvo

```
Usuário (browser)
      │
      ▼
Cloudflare Workers  ← CONCLUÍDO
      │
      ├── Cloudflare D1   ← banco de dados (SQLite na nuvem)
      ├── Cloudflare R2   ← arquivos e imagens
      ├── Cloudflare KV   ← cache e sessões
      └── Clerk           ← autenticação real
```

### Serviços escolhidos e justificativa

| Serviço       | Função                                     | Plano gratuito          |
| ------------- | ------------------------------------------ | ----------------------- |
| Cloudflare D1 | Banco de dados principal                   | 5 GB + 5M leituras/dia  |
| Cloudflare R2 | Armazenamento de arquivos                  | 10 GB                   |
| Cloudflare KV | Cache e sessões                            | 1 GB                    |
| Clerk         | Autenticação (login, senha, convites, 2FA) | Até 10.000 usuários/mês |
| Drizzle ORM   | Camada TypeScript para o banco D1          | Open source             |

**Para 50 usuários o custo é zero** — usa menos de 5% dos limites gratuitos.

### Etapas de implementação (em ordem)

- [x] **Deploy** — Cloudflare Workers + GitHub Actions CI/CD
- [ ] **Etapa 1** — Integrar Clerk (substituir auth mock do localStorage)
- [ ] **Etapa 2** — Criar banco D1 + schema com Drizzle ORM
- [ ] **Etapa 3** — Migrar leads para o banco (CRUD real)
- [ ] **Etapa 4** — Migrar usuários para o banco (gerenciamento real de equipe)
- [ ] **Etapa 5** — Cloudflare R2 para upload de arquivos e fotos

### Quando escalar além do gratuito

- Cloudflare Workers pago: **$5/mês** → milhões de requisições
- Clerk pago: **$25/mês** → acima de 10.000 usuários

## Observações importantes

- `src/routeTree.gen.ts` é **gerado automaticamente** pelo TanStack Router ao rodar o dev server — nunca editar manualmente
- Componentes em `src/components/ui/` são do shadcn/ui — para adicionar novos, usar `bunx shadcn@latest add <componente>`
- O arquivo `.wrangler/deploy/config.json` é gerado pelo wrangler após o deploy — não commitar (já está no `.gitignore`)
- Senhas são armazenadas em texto puro no localStorage — vulnerabilidade conhecida a resolver na migração para Clerk
