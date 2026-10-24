# Consignado Simulator

Aplicação full-stack (MVP) para **simulação estritamente fictícia de empréstimo consignado**, projetada para demonstrar arquitetura em camadas, validação rigorosa de entrada, cálculo financeiro pela Tabela Price, normalização de contratos heterogêneos via adaptadores e **isolamento de falhas entre múltiplas instituições financeiras**.

> **Aviso Importante — Escopo Fictício:**
> Este sistema utiliza exclusivamente regras, taxas e instituições simuladas (**Banco Alfa** e **Banco Beta**). Nenhuma consulta real de crédito ou bureau é realizada, os valores calculados são meramente estimativos (não constituem oferta de crédito) e nenhum CPF ou CNPJ é persistido em banco de dados, `localStorage` ou logs completos.

---

## Sumário

1. [Tecnologias Utilizadas](#tecnologias-utilizadas)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Pré-requisitos e Instalação Local](#pré-requisitos-e-instalação-local)
4. [Execução Local e com Docker Compose](#execução-local-e-com-docker-compose)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Contrato da API (`POST /api/simulations`)](#contrato-da-api-post-apisimulations)
7. [Testes Automatizados e Builds](#testes-automatizados-e-builds)
8. [Decisões Técnicas: Tabela Price, Regras Simuladas e Timeout](#decisões-técnicas-tabela-price-regras-simuladas-e-timeout)
9. [Limitações Conhecidas](#limitações-conhecidas)
10. [Melhorias Implementadas e Planejadas](#melhorias-implementadas-e-planejadas)
11. [Acesso administrativo e próximos passos de e-mail](#acesso-administrativo-e-próximos-passos-de-e-mail)

---

## Tecnologias Utilizadas

- **Monorepo:** npm Workspaces (`backend` e `frontend`)
- **Backend:** Node.js, TypeScript (modo estrito), Fastify 5, `@fastify/cors`, Zod
- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS 4, Lucide React (`lucide-react`), React Hook Form, `@hookform/resolvers`, Zod e controle de acesso demonstrativo em memória
- **Testes:** Vitest, Testing Library (`@testing-library/react`, `jsdom`)
- **Containers:** Docker e Docker Compose

---

## Estrutura de Pastas

```text
consignado-simulator/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── simulation.controller.ts
│   │   ├── errors/
│   │   │   ├── app-error.ts
│   │   │   └── error-handler.ts
│   │   ├── integrations/
│   │   │   ├── bank-integration.interface.ts
│   │   │   ├── banco-alfa.integration.ts
│   │   │   └── banco-beta.integration.ts
│   │   ├── routes/
│   │   │   └── simulation.routes.ts
│   │   ├── schemas/
│   │   │   ├── simulation.schema.ts
│   │   │   └── validators.ts
│   │   ├── services/
│   │   │   ├── price-calculator.service.ts
│   │   │   └── simulation.service.ts
│   │   ├── types/
│   │   │   └── simulation.types.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── integrations.test.ts
│   │   ├── price-calculator.test.ts
│   │   ├── schemas.test.ts
│   │   ├── simulation.routes.test.ts
│   │   └── simulation.service.test.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.build.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── public/
│   │   └── octafin-logo.png
│   ├── src/
│   │   ├── assets/
│   │   │   └── octafin-logo.png
│   │   ├── components/
│   │   │   ├── BankResultCard.tsx
│   │   │   ├── BankResultSkeleton.tsx
│   │   │   ├── BankRules.tsx
│   │   │   ├── DemoBanner.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── InputField.tsx
│   │   │   ├── QuickScenarios.tsx
│   │   │   ├── ResultsPanel.tsx
│   │   │   ├── ResultsSummary.tsx
│   │   │   ├── SimulationForm.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── hooks/
│   │   │   └── useSimulation.ts
│   │   ├── pages/
│   │   │   ├── AccessManagementPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SimulatorPage.test.tsx
│   │   │   └── SimulatorPage.tsx
│   │   ├── schemas/
│   │   │   ├── formatters.ts
│   │   │   ├── simulation.schema.test.ts
│   │   │   └── simulation.schema.ts
│   │   ├── services/
│   │   │   └── simulation.api.ts
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   └── simulation.types.ts
│   │   ├── App.test.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Pré-requisitos e Instalação Local

- **Node.js:** v20+ (recomendado v22 LTS)
- **npm:** v10+
- **Docker e Docker Compose:** (opcional, para execução via containers)

Na raiz do repositório, instale as dependências de todos os workspaces:

```bash
npm install
```

---

## Execução Local e com Docker Compose

### Opção 1: Execução local (via npm Workspaces)

Para iniciar **backend** (`http://localhost:3333`) e **frontend** (`http://localhost:5173`) simultaneamente em modo de desenvolvimento:

```bash
npm run dev
```

Ou individualmente em terminais separados:

```bash
npm run dev:backend
npm run dev:frontend
```

### Opção 2: Execução com Docker Compose

O `docker-compose.yml` sobe exclusivamente os dois serviços necessários (`backend` e `frontend`). Como a chamada à API parte do navegador do usuário na máquina host, o backend publica a porta `3333` no host e o frontend aponta por padrão para `http://localhost:3333`.

Para construir as imagens e iniciar os containers:

```bash
docker compose up --build
```

- **Interface Web (Frontend):** [http://localhost:5173](http://localhost:5173)
- **API HTTP (Backend):** [http://localhost:3333](http://localhost:3333)
- **Healthcheck:** [http://localhost:3333/health](http://localhost:3333/health)

Para encerrar e remover os containers:

```bash
docker compose down
```

---

## Variáveis de Ambiente

| Variável | Pacote | Valor Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `PORT` | `backend` | `3333` | Porta HTTP onde o servidor Fastify escuta. |
| `HOST` | `backend` | `0.0.0.0` | Endereço de bind do servidor HTTP. |
| `CORS_ORIGIN` | `backend` | `http://localhost:5173` | Origem(ns) permitida(s) pelo CORS (suporta lista separada por vírgula). |
| `BANK_TIMEOUT_MS` | `backend` | `1800` | Timeout individual (em ms) aplicado a cada integração bancária. |
| `BANCO_ALFA_LATENCY_MS` | `backend` | *(80 a 220ms aleatório)* | Latência fixa opcional (em ms) para o Banco Alfa. |
| `BANCO_BETA_LATENCY_MS` | `backend` | *(120 a 320ms aleatório)* | Latência fixa opcional (em ms) para o Banco Beta. |
| `BANCO_ALFA_FAILURE_MODE` | `backend` | `none` | Modo de falha controlada do Banco Alfa (`none`, `error` ou `timeout`). |
| `BANCO_BETA_FAILURE_MODE` | `backend` | `none` | Modo de falha controlada do Banco Beta (`none`, `error` ou `timeout`). |
| `VITE_API_URL` | `frontend` | `http://localhost:3333` | URL base da API chamada pelo navegador do usuário. |
| `VITE_USE_SIMULATION_STREAM` | `frontend` | `true` | Ativa a entrega progressiva por `POST /api/simulations/stream`. Defina como `false` ou `0` para usar o endpoint consolidado como fallback. |

---

## Acesso administrativo e próximos passos de e-mail

O frontend inclui uma tela de login e uma área de **Gerenciamento de acessos**, integradas ao backend:

- credencial inicial definida por `AUTH_ADMIN_EMAIL` e `AUTH_ADMIN_PASSWORD` (valores de desenvolvimento em `.env.example`);
- o administrador pode criar usuários, definir o perfil de **funcionário** ou **administrador** e ativar/desativar contas;
- funcionários autenticados acessam apenas o simulador; a área de gestão é exclusiva do administrador;
- usuários são persistidos em arquivo local fora do Git, senhas usam hash `scrypt` com salt e a sessão é enviada em cookie `HttpOnly`; as rotas administrativas exigem perfil de administrador.

### Evolução planejada: convite, aprovação e e-mail

Em uma versão de produção, a criação não ativaria o acesso imediatamente. O fluxo previsto seria:

1. o administrador cadastra nome, e-mail corporativo e perfil, deixando a conta em `pending`;
2. o backend gera um token de convite único, aleatório, com expiração curta e armazenado apenas como hash;
3. um provedor transacional envia um e-mail de convite com link HTTPS para criação de senha;
4. o funcionário define a senha, confirma o e-mail e a conta passa para `active`; tentativas expiradas ou revogadas permanecem inválidas;
5. o administrador recebe e-mails de auditoria para criação, aprovação, suspensão e reativação; o funcionário recebe somente comunicações do próprio acesso;
6. esquecimento de senha, troca de e-mail e MFA seguiriam o mesmo padrão de token curto, uso único, expiração e auditoria.

Isso exigiria autenticação no backend, banco de dados, hash de senha forte (por exemplo, Argon2id), sessão segura em cookie `HttpOnly`/`Secure`/`SameSite`, rate limiting, trilha de auditoria, RBAC validado no servidor e integração com um provedor de e-mail. Nenhuma senha, token de convite ou documento deve aparecer em logs ou analytics.

---

## Contrato da API (`POST /api/simulations`)

### Requisição

```http
POST /api/simulations
Content-Type: application/json
```

```json
{
  "name": "Pessoa Exemplo",
  "email": "pessoa.exemplo@exemplo.test",
  "cpf": "12345678909",
  "cnpj": "12345678000195",
  "salary": 5500,
  "requestedAmount": 10000,
  "installments": 24
}
```

> Os dados deste exemplo são sintéticos e servem somente para demonstrar o contrato da API. Não representam uma pessoa ou empresa real.

**Limites de validação (Zod):**
- `name`: 3 a 120 caracteres.
- `email`: formato de e-mail válido.
- `cpf`: 11 dígitos numéricos (aceita com ou sem pontuação), validado por dígitos verificadores (módulo 11) e rejeitando sequências repetidas (`11111111111`, etc.).
- `cnpj`: 14 dígitos numéricos (aceita com ou sem pontuação), validado por dígitos verificadores (módulo 11) e rejeitando sequências repetidas (`00000000000000`, etc.).
- `salary`: entre `R$ 500,00` e `R$ 1.000.000,00`.
- `requestedAmount`: entre `R$ 300,00` e `R$ 500.000,00`.
- `installments`: inteiro entre `6` e `84` parcelas.

### Exemplo de Resposta Consolidada (Demonstrando os 3 Estados: `approved`, `rejected` e `unavailable`)

Cada item em `results` segue o mesmo contrato normalizado, podendo assumir o estado `approved`, `rejected` ou `unavailable` (com `reasonCode` diferenciando `TIMEOUT` de `INTEGRATION_ERROR`):

```json
{
  "simulationId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "createdAt": "2026-10-23T19:50:00.000Z",
  "disclaimer": "Simulação estritamente fictícia para fins de demonstração técnica. Os cálculos utilizam a Tabela Price com taxas simuladas e não constituem proposta ou análise real de crédito.",
  "inputSummary": {
    "requestedAmount": 10000,
    "installments": 24
  },
  "results": [
    {
      "bankCode": "banco-alfa",
      "bankName": "Banco Alfa",
      "status": "approved",
      "monthlyInterestRate": 0.0175,
      "installmentAmount": 513.86,
      "approvedAmount": 10000,
      "installments": 24,
      "totalAmount": 12332.64,
      "message": "Proposta aprovada nas regras fictícias do Banco Alfa (valores meramente estimativos).",
      "reasonCode": "APPROVED",
      "responseTimeMs": 115
    },
    {
      "bankCode": "banco-beta",
      "bankName": "Banco Beta",
      "status": "rejected",
      "monthlyInterestRate": null,
      "installmentAmount": null,
      "approvedAmount": null,
      "installments": null,
      "totalAmount": null,
      "message": "Prazo fora da faixa fictícia do Banco Beta (permitido de 12 a 84 parcelas).",
      "reasonCode": "TERM_OUT_OF_RANGE",
      "responseTimeMs": 184
    },
    {
      "bankCode": "banco-exemplo-indisponivel",
      "bankName": "Banco Exemplo (Quando em Falha ou Timeout)",
      "status": "unavailable",
      "monthlyInterestRate": null,
      "installmentAmount": null,
      "approvedAmount": null,
      "installments": null,
      "totalAmount": null,
      "message": "Tempo limite excedido ao consultar o Banco Beta. Tente novamente em instantes.",
      "reasonCode": "TIMEOUT",
      "responseTimeMs": 1800
    }
  ]
}
```

### Entrega progressiva por instituição (`POST /api/simulations/stream`)

O endpoint de streaming recebe o mesmo JSON da rota consolidada, mas responde com `Content-Type: text/event-stream`. Para manter CPF e CNPJ no corpo do `POST`, o frontend consome o stream com `fetch` e `ReadableStream`, e não com `EventSource` (que só suporta `GET`).

Os eventos são emitidos nesta sequência:

1. `meta`: protocolo, parâmetros e instituições que terão um card;
2. `bank-result`: um evento para cada banco assim que a sua consulta termina — sem ordem fixa de chegada;
3. `complete`: confirmação de que todas as consultas terminaram.

O cliente mantém a ordem visual das instituições recebida em `meta`, renderiza um skeleton por banco pendente e o substitui assim que recebe seu respectivo `bank-result`. Falha e timeout continuam sendo resultados individuais `unavailable`, sem interromper os demais bancos.

---

## Testes Automatizados e Builds

A partir da raiz do monorepo:

```bash
# Executa toda a suíte Vitest (backend + frontend)
npm test

# Compila TypeScript e gera os pacotes de produção dos dois workspaces
npm run build
```

Os testes cobrem:
- Validação de CPF e CNPJ (com/sem máscara, dígitos verificadores e rejeição de sequências repetidas);
- Schema de entrada para e-mail, salário, valor solicitado e parcelas;
- Cálculo financeiro pela Tabela Price (incluindo taxa zero e limites de prazo);
- Regras fictícias de aprovação e reprovação do Banco Alfa e do Banco Beta;
- Normalização dos payloads distintos de cada banco (`snake_case` em reais no Alfa vs estrutura aninhada em centavos no Beta);
- Isolamento de falha técnica (`INTEGRATION_ERROR`) e de timeout (`TIMEOUT`) em uma instituição mantendo o sucesso da outra;
- Mascaramento obrigatório de CPF nos logs (`***.982.***-25`);
- Endpoint consolidado `POST /api/simulations` e sua compatibilidade como fallback;
- Stream `POST /api/simulations/stream`: framing SSE, ordem de conclusão, timeout individual e ausência de CPF/CNPJ nos eventos;
- Parser de SSE no frontend, incluindo chunks parciais/múltiplos, CRLF e abort;
- Substituição incremental de skeleton por card bancário na interface React.
- Login demonstrativo, criação de funcionário pelo administrador e ativação/desativação de acesso em memória.

---

## Decisões Técnicas: Tabela Price, Regras Simuladas e Timeout

### 1. Fórmula Price para Parcelas Fixas

Para estimar o valor da prestação mensal fixa em regime de juros compostos, foi adotada a **Tabela Price**:

$$\text{parcela} = \frac{\text{principal} \times \text{taxa}}{1 - (1 + \text{taxa})^{-n}}$$

Quando $\text{taxa} = 0$, o cálculo utiliza a divisão linear $\text{principal} / n$. Os valores monetários são arredondados para duas casas decimais (`centavos`) e acompanhados de aviso explícito de que não representam Custo Efetivo Total (CET) nem incluem IOF ou tarifas bancárias.

### 2. Regras Fictícias por Instituição e Normalização via Adaptadores

Cada instituição possui um formato bruto próprio e regras estritamente fictícias para permitir testar todos os cenários:

| Critério Fictício | Banco Alfa (Perfil Conservador) | Banco Beta (Perfil Flexível) |
| :--- | :--- | :--- |
| **Formato Bruto Simulado** | Objeto plano `snake_case` com valores em reais (`R$`) | Objeto aninhado `camelCase` com valores em centavos |
| **Taxa Mensal Simulada** | `1,75% a.m.` (`0.0175`) | `1,98% a.m.` (`0.0198`) |
| **Faixa de Valor Solicitado** | Até `R$ 50.000,00` | De `R$ 1.000,00` a `R$ 120.000,00` |
| **Prazo Permitido** | `6` a `48` parcelas | `12` a `84` parcelas |
| **Comprometimento Máximo** | Parcela $\le 30\%$ do salário | Parcela $\le 35\%$ do salário |

### 3. Isolamento de Falhas e Timeout Individual

- Cada adaptador bancário é executado de forma concorrente por meio de `Promise.allSettled` e protegido por um wrapper `withTimeout` individual (padrão `1800ms`).
- Caso uma instituição lance exceção de integração ou ultrapasse seu tempo limite, o `SimulationService` converte o erro exclusivamente para aquela instituição no estado `unavailable` (`reasonCode: 'INTEGRATION_ERROR'` ou `'TIMEOUT'`), preservando o resultado das demais instituições.
- Para facilitar demonstrações manuais sem reiniciar containers, além das variáveis `BANCO_ALFA_FAILURE_MODE` e `BANCO_BETA_FAILURE_MODE`, o simulador aceita tags de teste no e-mail (disponíveis também nos botões de preenchimento rápido da interface):
  - `+erro-alfa@` ou `+erro-beta@`: força falha técnica na respectiva instituição;
  - `+timeout-alfa@` ou `+timeout-beta@`: força estouro de timeout na respectiva instituição.

---

## Limitações Conhecidas

1. **Sem persistência em banco de dados:** Por decisão de escopo e privacidade do MVP, as simulações existem apenas durante o ciclo de vida da requisição e na memória da tela atual.
2. **Cálculo sem impostos ou tarifas (CET):** A parcela é calculada puramente pela fórmula matemática da Tabela Price, sem incidência de IOF, seguros ou tarifas cadastrais.
3. **Sem retomada de stream:** A conexão é cancelada ao iniciar nova simulação, resetar a tela ou desmontar o componente. Se ela cair depois de já entregar resultados, a interface preserva os cards recebidos e informa a interrupção, mas não há reconexão automática nem `Last-Event-ID` neste MVP.
4. **Sessões em memória:** Usuários e hashes de senha são persistidos em arquivo local, mas as sessões ativas vivem em memória e expiram ao reiniciar o backend. Para múltiplas instâncias, usar um armazenamento compartilhado de sessões e um banco de dados dedicado.

---

## Melhorias Implementadas e Planejadas

### O que foi implementado neste MVP

#### 1. Isolamento de falhas por instituição (`Promise.allSettled` + Timeout individual)
- **Problema:** Em um simulador que consulta múltiplos bancos, uma falha de rede ou lentidão em apenas uma instituição derrubaria toda a requisição (`HTTP 500/504`) se as chamadas fossem acopladas com `Promise.all` ou sem timeout individual.
- **Proposta:** Foi implementado um wrapper `withTimeout` individual por banco e orquestração com `Promise.allSettled` no `SimulationService`, convertendo falhas técnicas e estouros de tempo em resultados normalizados com estado `unavailable` (`reasonCode: 'INTEGRATION_ERROR'` ou `'TIMEOUT'`).
- **Por quê:** Para o **cliente**, garante que ele receba e compare imediatamente as propostas dos bancos que responderam com sucesso sem ficar bloqueado por um parceiro fora do ar; para a **operação**, evita que a instabilidade de um parceiro externo derrube a taxa de sucesso global do simulador.

#### 2. Distinção clara na interface entre Reprovação de Regra e Indisponibilidade Técnica
- **Problema:** Quando uma integração bancária falha ou sofre timeout, exibir uma mensagem genérica de erro induz o usuário a achar que teve o crédito negado pelo banco.
- **Proposta:** No redesign UI/UX (identidade OctaFin), foram implementados os componentes `StatusBadge`, `ResultsSummary` e `BankResultCard` separando visual e semanticamente `Aprovado (Simulado)`, `Reprovado` (critério não atendido) e `Indisponível` (timeout ou falha técnica, com aviso explícito de que não representa recusa de crédito).
- **Por quê:** Para o **cliente**, elimina frustração e dá transparência sobre quando vale a pena tentar novamente mais tarde versus ajustar o valor/prazo solicitado; para a **operação/atendimento**, reduz chamados de suporte causados por falsas percepções de reprovação.

#### 3. Padrão Adapter para normalização de contratos bancários heterogêneos
- **Problema:** Cada instituição financeira opera com formatos de dados próprios (neste projeto, o Banco Alfa utiliza chaves `snake_case` em reais e o Banco Beta utiliza objetos aninhados em `camelCase` com valores em centavos).
- **Proposta:** Foram implementados adaptadores dedicados (`normalizeBancoAlfaResponse` e `normalizeBancoBetaResponse`) que traduzem o payload nativo de cada banco para o contrato único `BankSimulationResult`.
- **Por quê:** Para a **operação e engenharia**, permite plugar novas instituições financeiras sem modificar o controller, o serviço de orquestração ou os componentes React; para o **cliente**, garante comparação padronizada lado a lado.

#### 4. Mascaramento de CPF em logs e envio de dados sem formatação
- **Problema:** Formulários com máscara visual costumam enviar caracteres de pontuação para a API, e logs de aplicação frequentemente acabam gravando o CPF completo em texto puro.
- **Proposta:** Foram implementadas máscaras visuais no frontend (`formatCpfMask`, `formatCnpjMask`, `formatCurrencyInputMask`) que limpam a formatação antes do envio, validação de dígitos verificadores (módulo 11) via Zod nas duas pontas e mascaramento obrigatório (`maskCpf` -> `***.982.***-25`) em todos os logs do backend.
- **Por quê:** Para o **cliente**, proporciona preenchimento fluido e proteção de dados pessoais; para a **operação**, mantém rastreabilidade de incidentes por `simulationId` sem expor documentos completos em ferramentas de log.

#### 5. Entrega progressiva de resultados por instituição (SSE / Streaming)
- **Problema:** A resposta consolidada aguardava a última instituição concluir ou atingir o `BANK_TIMEOUT_MS`. Assim, quando Alfa respondia em `90ms` e Beta sofria timeout em `1800ms`, nenhuma proposta aparecia durante `1,8s`.
- **Proposta:** Foi adicionado `POST /api/simulations/stream`, que inicia as integrações em paralelo e envia SSE `meta`, `bank-result` e `complete`. O React consome a resposta via `fetch` streaming e substitui o skeleton somente do banco que terminou; `POST /api/simulations` permanece como fallback configurável.
- **Por quê:** Para o **cliente**, o primeiro resultado fica visível assim que a primeira instituição responde. Para a **operação**, propostas válidas deixam de depender da latência do parceiro mais lento, preservando isolamento de timeout e falhas.

#### 6. Login demonstrativo e gestão administrativa de acessos
- **Problema:** Sem uma camada de acesso, qualquer pessoa que abra a interface pode usar o simulador e não existe uma experiência para o administrador controlar a entrada de funcionários.
- **Proposta:** Foi incluída uma tela de login e uma área exclusiva de administração. O administrador inicial pode criar usuários, escolher os perfis de funcionário ou administrador e ativar/desativar acessos durante a sessão. O estado é propositalmente efêmero e local.
- **Por quê:** Para a **operação**, demonstra a separação entre quem gerencia acessos e quem apenas executa simulações; para a **evolução técnica**, estabelece uma UI pronta para ser conectada a RBAC e autenticação reais, sem alegar segurança inexistente.

---

### O que ficou só planejado (Em ordem de prioridade: o que seria feito primeiro com mais uma semana)

#### Prioridade 1 — Circuit Breaker por integração bancária
- **Problema:** Se a API de um banco parceiro ficar indisponível por vários minutos, continuar disparando chamadas e aguardando o estouro de timeout em todas as simulações retém conexões desnecessariamente e degrada a latência média.
- **Proposta:** Adicionar um *Circuit Breaker* isolado por `bankCode` (estados *Closed*, *Open* e *Half-Open*): após uma sequência configurável de falhas/timeouts consecutivos, o circuito abre por uma janela curta (ex.: 30s) e retorna `unavailable` instantaneamente sem aguardar o timeout completo.
- **Por quê:** Para a **operação**, protege os recursos do backend e evita sobrecarga em cascata sobre o parceiro instável; para o **cliente**, elimina a espera de timeout quando um banco já é sabidamente indisponível naquele momento.

#### Prioridade 2 — Telemetria e métricas de SLA por banco (OpenTelemetry / Prometheus)
- **Problema:** Logs individuais permitem investigar uma simulação específica, mas não mostram facilmente se a taxa de timeout ou a latência `p95` de um banco parceiro subiu nos últimos minutos.
- **Proposta:** Instrumentar contadores de desfecho (`approved`, `rejected`, `unavailable` por `reasonCode`) e histogramas de `responseTimeMs` segmentados por `bankCode`.
- **Por quê:** Para a **operação**, permite detectar degradação técnica de parceiros bancários em tempo real e acionar alertas antes que o impacto se generalize; para o **cliente**, resulta em maior estabilidade do serviço.

#### Prioridade 3 — Aprovação de novos funcionários e ciclo de e-mails transacionais
- **Problema:** Criar e liberar uma conta diretamente na interface não oferece comprovação de que o e-mail pertence ao funcionário, não há expiração de convite nem trilha auditável de aprovações.
- **Proposta:** Persistir contas como `pending`, enviar convite por e-mail com token de uso único e expiração, permitir definição inicial de senha apenas pelo link e registrar aprovações, suspensões, reativações e redefinições de senha. Incluir e-mails de convite, confirmação de ativação, revogação, recuperação de senha e alertas de segurança.
- **Por quê:** Para o **administrador**, reduz criação manual e melhora rastreabilidade; para o **funcionário**, fornece um ingresso seguro e claro; para a **operação**, permite aplicar políticas de identidade e conformidade no servidor.
