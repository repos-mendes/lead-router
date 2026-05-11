# Lead Flow Pro — Guia do Projeto

## O que é este projeto

CRM de leads imobiliários chamado **LeadFlow**. Gerencia o fluxo de clientes interessados em imóveis, do primeiro contato até a venda, com dashboards diferentes por perfil de usuário.

## Stack tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| TypeScript | ~5.8 | Linguagem principal |
| React | 19 | Framework de UI |
| TanStack Start | ~1.167 | SSR e servidor |
| TanStack Router | ~1.168 | Roteamento por arquivos |
| TanStack Query | ~5.83 | Gerenciamento de estado/dados |
| Tailwind CSS | v4 | Estilização |
| shadcn/ui + Radix UI | — | Componentes prontos |
| Vite | 7 | Build tool |
| Bun | 1.3.13 | Package manager e runtime |
| Cloudflare Workers | — | Plataforma de deploy |

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
│   ├── login.tsx            # Tela de login (mock, sem validação real)
│   ├── app.tsx              # Layout principal (sidebar + header) com guarda de auth
│   ├── app.index.tsx        # Dashboard (muda conforme o perfil do usuário)
│   ├── app.leads.new.tsx         # Formulário de novo lead (SDR seleciona destinatário)
│   ├── app.distribution.tsx      # Distribuição de leads — ADM (sua cidade) e Gestor (tudo)
│   ├── app.my-leads.tsx          # Fila do corretor: Aguardando ação / Lead Aceito / Histórico
│   ├── app.analytics.tsx         # Relatórios e gráficos
│   ├── app.users.tsx             # Gerenciamento de usuários
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
├── lib/
│   ├── auth.tsx             # Context de autenticação (localStorage)
│   ├── mock-data.ts         # Dados fictícios, CRUD via localStorage
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

| Role | Acesso |
|---|---|
| `gestor` | Visão total — todos os leads, gerencia usuários e empreendimentos, reatribui qualquer lead |
| `coordenador` | Métricas e acompanhamento da equipe (read-only) |
| `adm` | Recebe leads do SDR e distribui para corretores da sua cidade |
| `sdr` | Cadastra novos leads e escolhe o destinatário (corretor ou ADM) |
| `corretor` | Aceita leads da sua fila e registra o resultado do contato |

Os perfis `adm` e `corretor` têm `cidadeId` — são vinculados a uma cidade específica.

## Fluxo de leads

```
SDR cadastra lead
  └─ escolhe destinatário
       ├─ Corretor → status "distribuido", corretorNome preenchido
       └─ ADM     → status "aguardando",  destinatarioNome preenchido

ADM (ou Gestor) distribui via /app/distribution
  └─ atribui a Corretor → status "distribuido"
  └─ reatribui a outro ADM → status "aguardando"

Corretor acessa /app/my-leads
  └─ clica "Aceitar Lead" → status "em_atendimento" (contato revelado)
       ├─ "Contato Feito"   → status "contato_feito"
       └─ "Número Inválido" → status "numero_invalido"
```

**Regra defensiva:** leads com `status "aguardando"` e `corretorNome` preenchido também aparecem na fila do corretor (dados corrompidos não ficam invisíveis).

## Status e cores

| Valor interno     | Label             | Cor badge  |
|-------------------|-------------------|------------|
| `aguardando`      | Aguardando        | Âmbar      |
| `distribuido`     | Aguardando ação   | Laranja    |
| `em_atendimento`  | Lead Aceito       | Azul       |
| `contato_feito`   | Contato Feito     | Verde      |
| `numero_invalido` | Número Inválido   | Vermelho   |

Definidos em `src/components/shared.tsx` → `StatusBadge`. Mesmas cores usadas em todas as dashboards.

## Dados e autenticação

- **Sem banco de dados real** — todos os dados ficam no `localStorage` do navegador
- **Auth mockada** — tela de login lista usuários mock por perfil; `login()` recebe `nome` explícito para garantir que `corretorNome === user.nome` funcione na filtragem de leads
- Dados são perdidos se o localStorage for limpo
- `src/lib/mock-data.ts` contém seeds, interfaces e funções CRUD

### Versionamento do seed (localStorage)

| Chave                            | Versão atual | Limpa quando |
|----------------------------------|-------------|--------------|
| `leadflow_seed_version`          | `v3`        | seed de leads muda |
| `leadflow_empreendimentos_version` | `v2`      | schema de empreendimentos muda |

Ao trocar a versão no código, o localStorage é limpo automaticamente no próximo carregamento.

### Estrutura de dados principais

**Lead:** `id, nome, telefone, cidadeId, empreendimento, notas?, status, sdrNome, corretorNome?, destinatarioNome?, criadoEm`

**Empreendimento:** `id, nome, cidade (texto livre), status ("ativo"|"inativo"), criadoEm`
- `loadEmpreendimentos()` / `saveEmpreendimentos()` — chave `leadflow_empreendimentos`
- Campo `cidade` é texto livre (não referencia CIDADES)

## Configuração do Vite (`vite.config.ts`)

O projeto foi migrado de `@lovable.dev/vite-tanstack-config` para plugins individuais:

```ts
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { cloudflare } from '@cloudflare/vite-plugin'
```

**Importante:** o plugin `cloudflare` é aplicado **apenas no build**, não no dev. Isso é necessário porque o runtime `workerd` (Cloudflare) causa problemas no Windows durante o desenvolvimento. Usar `({ command }) => ...` no defineConfig para aplicar condicionalmente.

## Path alias

`@/` mapeia para `src/` (configurado no `tsconfig.json` e resolvido pelo `vite-tsconfig-paths`).

```ts
import { useAuth } from '@/lib/auth'  // → src/lib/auth.tsx
```

## Roadmap: migração para produção

> Planejado — ainda não implementado. Objetivo: transformar o mock em CRM real.

### Arquitetura alvo

```
Usuário (browser)
      │
      ▼
Cloudflare Workers  ← já configurado
      │
      ├── Cloudflare D1   ← banco de dados (SQLite na nuvem)
      ├── Cloudflare R2   ← arquivos e imagens
      ├── Cloudflare KV   ← cache e sessões
      └── Clerk           ← autenticação real
```

### Serviços escolhidos e justificativa

| Serviço | Função | Plano gratuito |
|---|---|---|
| Cloudflare D1 | Banco de dados principal | 5 GB + 5M leituras/dia |
| Cloudflare R2 | Armazenamento de arquivos | 10 GB |
| Cloudflare KV | Cache e sessões | 1 GB |
| Clerk | Autenticação (login, senha, convites, 2FA) | Até 10.000 usuários/mês |
| Drizzle ORM | Camada TypeScript para o banco D1 | Open source |

**Para 50 usuários o custo é zero** — usa menos de 5% dos limites gratuitos.

### Etapas de implementação (em ordem)

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
- Deploy via Cloudflare Workers — configuração em `wrangler.jsonc`
