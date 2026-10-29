# API de Monitoramento de Equipamentos

API REST para cadastrar equipamentos de rede (câmeras, controladores de acesso, sensores, switches, gateways) e receber leituras de telemetria deles. Cada equipamento pode ter limites mínimo e máximo; quando uma leitura passa do limite, a API gera um alerta.

O tema vem de um problema comum em projetos de integração: equipamentos de fabricantes diferentes, falando por rede, enviando valores que alguém precisa guardar, consultar por período e acompanhar. Aqui o recebimento é feito por HTTP; a camada que conversa com o equipamento (SDK, DLL ou protocolo do fabricante) fica fora e chamaria esta API.

## Stack

- NestJS 11 + TypeScript
- Prisma 6 (SQLite em dev e testes; o schema está pronto para trocar por PostgreSQL)
- JWT para autenticação, senha com scrypt (módulo `crypto` do Node, sem dependência extra)
- class-validator para validação, Swagger em `/docs`
- Jest + supertest para testes
- Docker / docker-compose e GitHub Actions

## Como rodar localmente

Requisitos: Node 22+ e npm.

```bash
npm install
cp .env.example .env          # ajuste JWT_SECRET e ADMIN_EMAIL
npx prisma migrate dev        # cria o banco SQLite e aplica as migrações
npm run start:dev
```

A API sobe em `http://localhost:3000` e a documentação interativa em `http://localhost:3000/docs`.

Quem se cadastrar com o e-mail definido em `ADMIN_EMAIL` recebe o papel `ADMIN`. Os demais são `OPERADOR`.

## Como rodar com Docker

```bash
docker compose up --build                                   # SQLite (volume persistente)
docker compose --profile postgres up --build app-postgres   # PostgreSQL, porta 3001
```

O Dockerfile troca o `provider` do Prisma conforme o argumento `DB_PROVIDER`. No modo PostgreSQL o schema é aplicado com `prisma db push`, porque as migrações versionadas em `prisma/migrations` foram geradas para SQLite.

Observação honesta: a imagem SQLite foi construída e respondeu em `/health` e `/auth/registro` num container; o perfil com PostgreSQL ainda não foi executado de ponta a ponta.

## Trocar para PostgreSQL sem Docker

1. Em `prisma/schema.prisma`, mude `provider = "sqlite"` para `provider = "postgresql"`.
2. Ajuste `DATABASE_URL` no `.env` (exemplo no `.env.example`).
3. Apague a pasta `prisma/migrations` e gere uma nova com `npx prisma migrate dev`, ou use `npx prisma db push`.

## Endpoints principais

Todos exigem `Authorization: Bearer <token>`, exceto `/auth/registro`, `/auth/login`, `/health` e `/docs`.

| Método | Rota | Papel | Descrição |
|---|---|---|---|
| POST | `/auth/registro` | público | Cadastra usuário |
| POST | `/auth/login` | público | Devolve o token JWT |
| GET | `/auth/eu` | autenticado | Dados do usuário do token |
| POST | `/equipamentos` | ADMIN | Cadastra equipamento |
| GET | `/equipamentos` | autenticado | Lista com `page`, `limit`, `tipo`, `ativo`, `busca` |
| GET | `/equipamentos/:id` | autenticado | Detalha um equipamento |
| PATCH | `/equipamentos/:id` | ADMIN | Atualiza (inclusive limites de alerta) |
| DELETE | `/equipamentos/:id` | ADMIN | Remove, com leituras e alertas |
| POST | `/equipamentos/:id/leituras` | autenticado | Registra leitura; devolve alerta se violou limite |
| GET | `/equipamentos/:id/leituras` | autenticado | Lista por período (`de`, `ate`, paginação) |
| GET | `/equipamentos/:id/leituras/agregacao-horaria` | autenticado | Média, mínimo, máximo e contagem por hora (UTC) |
| GET | `/alertas` | autenticado | Lista alertas (`equipamentoId`, `reconhecido`) |
| PATCH | `/alertas/:id/reconhecer` | autenticado | Marca o alerta como reconhecido |
| GET | `/health` | público | Verificação simples de saúde |

Exemplo rápido:

```bash
curl -X POST localhost:3000/auth/registro -H "Content-Type: application/json" \
  -d '{"nome":"Admin","email":"admin@exemplo.com","senha":"senha-forte-123"}'
TOKEN=$(curl -s -X POST localhost:3000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@exemplo.com","senha":"senha-forte-123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).accessToken")
curl -X POST localhost:3000/equipamentos -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nome":"Sensor da sala de TI","tipo":"SENSOR","unidade":"C","limiteMax":35}'
```

## Testes

```bash
npm run lint        # ESLint
npm test            # testes unitários (services, guard, filtro, funções puras)
npm run test:e2e    # testes de ponta a ponta com supertest, usando prisma/test.db
npm run build
```

Os testes e2e recriam um banco SQLite descartável (`prisma/test.db`) a cada execução. O mesmo conjunto (lint, testes e build) roda no GitHub Actions a cada push.

## Decisões de arquitetura

- **Camadas**: controller (HTTP e documentação), service (regras de negócio), repository (único ponto que fala com o Prisma). Os testes unitários dos services usam repositórios simulados.
- **Módulos por domínio**: `auth`, `equipamentos`, `leituras`, `alertas`. Leituras depende de equipamentos e alertas, nunca o contrário.
- **Guards globais**: o JWT é exigido por padrão e as rotas abertas são marcadas com `@Public()`. Papéis entram com `@Papeis(...)`. Esquecer de proteger uma rota nova falha para o lado seguro.
- **Senha com scrypt**: vem no Node, com salt aleatório e comparação em tempo constante.
- **Papéis como string**: o SQLite não tem enum, então papel, tipo de equipamento e tipo de alerta são strings validadas nos DTOs. No PostgreSQL daria para migrar para enums do Prisma.
- **Agregação por hora em código**: as leituras do período são agrupadas em TypeScript, o que funciona igual em SQLite e PostgreSQL. Com volume grande, o caminho é mover isso para SQL (`date_trunc` no PostgreSQL).
- **Alertas simples**: a regra é só valor acima do máximo ou abaixo do mínimo do equipamento, avaliada na hora do POST. Não há debounce, histerese nem notificação externa.
- **Erros padronizados**: um filtro global devolve sempre o mesmo formato (`statusCode`, `erro`, `mensagem`, `caminho`, `timestamp`), traduz erros conhecidos do Prisma (duplicidade vira 409) e não vaza detalhes de erros inesperados.

## Limitações

- Sem refresh token, sem troca de papel via API e sem limite de requisições.
- Os horários da agregação são em UTC.
- Não há ingestão em lote nem protocolo específico de fabricante; a API recebe um valor por requisição.

## Licença

MIT. Veja o arquivo `LICENSE`.
