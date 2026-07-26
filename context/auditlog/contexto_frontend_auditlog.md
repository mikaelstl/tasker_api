# Contexto do front-end para Audit Log

> Este documento orienta somente a implementação da visualização dos logs e dos mocks no `tasker_app`.
>
> A modelagem e as regras gerais do backend continuam descritas em [`contexto_modulo_auditlog.md`](./contexto_modulo_auditlog.md).

---

## Objetivo

Substituir a origem atual da área **Atualizações**, hoje montada a partir de comentários de projetos, por uma timeline de atividades baseada em `AuditLog`.

O front-end deve:

* consultar os logs da organização selecionada;
* transformar dados estruturados em texto de apresentação;
* mostrar ator, data, ação, recurso e alterações relevantes;
* permitir filtros e paginação;
* funcionar com serviços reais ou mocks através do mecanismo já usado pelo projeto;
* manter uma apresentação segura quando receber um enum ou campo ainda desconhecido.

### Escopo somente leitura

O front-end deve **somente consultar e exibir** os logs de auditoria gerados pelo backend.
Ele não cria, altera nem exclui logs, inclusive após executar outras mutações da
aplicação. Portanto, não deve existir formulário, chamada `POST`, `PUT`, `PATCH` ou
`DELETE`, nem criação local de registros de audit log no front.

Os mocks servem apenas para simular a resposta da consulta durante o desenvolvimento
da interface; eles não representam autorização para o front gerar logs. A criação e
a persistência dos registros de auditoria são responsabilidades exclusivas do backend.

---

## Situação atual do backend

O front não deve assumir que a consulta já está disponível.

Atualmente existem:

* o model Prisma `AuditLog`;
* os enums `AuditActorType`, `AuditAction` e `AuditResource`;
* o campo estruturado `changes`;
* o `AuditLogService.log()` para gravação interna;
* o DTO `FindAuditLogsQuery` com os filtros aceitos;
* o módulo global registrado no `AppModule`.

Ainda não existem no código atual:

* implementação do `GET /org/:id/audit-logs` no controller;
* método de consulta e paginação no service;
* contrato concreto da resposta paginada;
* instrumentação dos outros módulos chamando `AuditLogService.log()`.

Portanto, os mocks são a fonte de desenvolvimento da interface neste momento. A estrutura paginada sugerida abaixo deve ser alinhada com o backend quando o endpoint de consulta for implementado.

---

## Endpoint esperado

```http
GET /org/:id/audit-logs
Authorization: Bearer <token>
x-org-key: <id-da-organizacao>
```

O `:id` da rota e o header `x-org-key` devem representar a mesma organização.

Parâmetros opcionais:

| Parâmetro | Tipo | Uso |
| --- | --- | --- |
| `actorkey` | `string` | filtrar pelo username do ator |
| `action` | `AuditAction` | filtrar pelo tipo de ação |
| `resource` | `AuditResource` | filtrar pelo tipo de recurso |
| `resourcekey` | `string` | filtrar por uma entidade específica |
| `startDate` | ISO 8601 | início do período |
| `endDate` | ISO 8601 | fim do período |
| `page` | inteiro a partir de `1` | página solicitada; padrão `1` |
| `limit` | inteiro de `1` a `100` | itens por página; padrão `20` |

Exemplo:

```http
GET /org/org-001/audit-logs?resource=TASKS&action=STATUS_CHANGE&page=1&limit=20
```

Os registros devem chegar em ordem decrescente de `created_at`.

### Resposta paginada a alinhar com o backend

Como a forma final da paginação ainda não foi implementada, o front e o mock devem partir provisoriamente deste contrato:

```json
{
  "status": 200,
  "message": "Logs de auditoria listados com sucesso.",
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  },
  "path": "/org/org-001/audit-logs?page=1&limit=20",
  "timestamp": "2026-07-21T18:00:00.000Z"
}
```

Não espalhar o formato da paginação pelos componentes. O `AuditLogService` do front deve ser o ponto de adaptação caso o backend entregue outro envelope.

---

## Tipos do front-end

Criar os tipos em uma pasta própria, por exemplo:

```text
src/service/types/audit-log/
├── audit-log.dto.ts
└── audit-log.query.dto.ts
```

Contrato sugerido:

```typescript
export const auditActorTypes = ["USER", "SYSTEM"] as const;
export type AuditActorType = (typeof auditActorTypes)[number];

export const auditActions = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "ADD",
  "REMOVE",
  "COMMENT",
  "STATUS_CHANGE",
  "SYSTEM_UPDATE",
] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditResources = [
  "ORGS",
  "AFFILIATIONS",
  "PROJECTS",
  "MEMBERS",
  "TASKS",
  "COMMENTS",
  "EVENTS",
  "PROJECT_STATS",
] as const;
export type AuditResource = (typeof auditResources)[number];

export type AuditJsonValue =
  | string
  | number
  | boolean
  | null
  | AuditJsonValue[]
  | { [key: string]: AuditJsonValue };

export interface AuditLogFieldChange {
  oldValue: AuditJsonValue;
  newValue: AuditJsonValue;
}

export type AuditLogChanges = Record<string, AuditLogFieldChange>;

export interface AuditLogActorDTO {
  username: string;
  name: string;
  photo?: { url: string } | null;
}

export interface AuditLogDTO {
  id: string;
  orgkey: string;
  actorkey: string | null;
  actorType: AuditActorType;
  action: AuditAction;
  resource: AuditResource;
  resourcekey: string | null;
  changes: AuditLogChanges;
  created_at: string;
  actor: AuditLogActorDTO | null;
}

export interface AuditLogPageDTO {
  items: AuditLogDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogQueryDTO {
  actorkey?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resourcekey?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
```

Os tipos devem refletir os valores literais do Prisma. Não traduzir valores no transporte e não reutilizar os enums de autorização do front como contrato de audit log.

`actor` pode ser `null` em dois casos:

* `actorType === "SYSTEM"`;
* o usuário que realizou a ação foi removido depois do registro, pois a relação usa `onDelete: SetNull`.

---

## Serviço real

Seguir o padrão dos serviços existentes:

```text
src/service/modules/audit-log/audit-log.service.ts
```

```typescript
export interface AuditLogServiceI {
  list(
    orgId: string,
    query?: AuditLogQueryDTO,
  ): Promise<ApiResponse<AuditLogPageDTO>>;
}

export class AuditLogService implements AuditLogServiceI {
  constructor(private readonly api: ApiClient) {}

  list(orgId: string, query: AuditLogQueryDTO = {}) {
    return this.api.load<AuditLogPageDTO, AuditLogQueryDTO>({
      route: `/org/${orgId}/audit-logs`,
      params: query,
    });
  }
}
```

Registrar `AuditLogService` em:

* `ServicesContextInterface`;
* `ServicesProvider.realServices`;
* `ServicesProvider.mockServices`;
* retorno do hook `useServices()`.

O interceptor do `ApiClient` deve continuar responsável pelos headers de autenticação e organização. A tela não deve montar esses headers manualmente.

---

## Uso na área Atualizações

A área existente já possui uma timeline com `Updates` e `UpdateCard`. Ela pode ser reaproveitada visualmente, mas o contrato atual `UpdateDTO` representa comentários e não deve ser usado como tipo de audit log.

Mudança conceitual:

```text
Antes
CommentService.list() de cada projeto
        ↓
UpdateDTO / CommentDTO
        ↓
Updates

Depois
AuditLogService.list(orgId)
        ↓
AuditLogDTO
        ↓
formatAuditLog(log)
        ↓
Updates / UpdateCard
```

O dashboard não deve continuar buscando comentários apenas para montar a timeline. Comentários continuarão existindo como entidade própria, mas uma atividade de comentário chegará como:

```text
action = COMMENT
resource = COMMENTS
```

### Conteúdo mínimo de cada item

Cada item da timeline deve mostrar:

* nome do usuário ou `Sistema`;
* avatar do usuário, quando disponível;
* texto da atividade montado no front;
* data e hora locais;
* indicação visual do recurso;
* detalhes de `oldValue → newValue` quando a alteração for relevante.

Para ator removido, mostrar `Usuário removido`. Para ator do sistema, mostrar `Sistema` com um ícone neutro, sem tentar carregar avatar.

Usar `created_at` como data do evento. O campo `date` de comentário não faz parte do contrato de audit log.

### Estados obrigatórios

A área deve tratar:

* carregamento inicial com skeleton ou indicador de progresso;
* lista vazia com `Nenhuma atualização encontrada`;
* erro com mensagem e ação `Tentar novamente`;
* troca de organização, limpando os dados anteriores antes de exibir o novo tenant;
* carregamento de próxima página sem apagar os itens já exibidos;
* fim da paginação quando `page >= totalPages`;
* resposta atrasada de uma organização antiga sem sobrescrever a organização atual.

O padrão de `requestId` já usado em `useOrganizerDashboard` pode ser mantido para descartar respostas obsoletas.

---

## Formatação das mensagens

O backend não persiste `message`. A mensagem deve ser gerada por uma função pura e centralizada, por exemplo:

```text
src/utils/audit-log/formatAuditLog.ts
```

Não montar textos diretamente dentro do JSX e não armazenar `content` duplicado nos mocks.

### Dicionários de apresentação

```typescript
const resourceLabels: Record<AuditResource, string> = {
  ORGS: "organização",
  AFFILIATIONS: "afiliação",
  PROJECTS: "projeto",
  MEMBERS: "membro",
  TASKS: "tarefa",
  COMMENTS: "comentário",
  EVENTS: "evento",
  PROJECT_STATS: "relatório do projeto",
};

const actionLabels: Record<AuditAction, string> = {
  CREATE: "criou",
  UPDATE: "atualizou",
  DELETE: "excluiu",
  ADD: "adicionou",
  REMOVE: "removeu",
  COMMENT: "comentou em",
  STATUS_CHANGE: "alterou o status de",
  SYSTEM_UPDATE: "atualizou automaticamente",
};
```

A mensagem não deve depender apenas desses dois mapas. Deve aproveitar campos reconhecidos em `changes` para produzir textos mais úteis.

Exemplos esperados:

| Dados principais | Texto possível |
| --- | --- |
| `CREATE + PROJECTS`, `title.newValue = "Portal"` | `criou o projeto Portal` |
| `CREATE + TASKS`, `name.newValue = "Login"` | `criou a tarefa Login` |
| `STATUS_CHANGE + TASKS`, `stage: PENDING → IN_PROGRESS` | `alterou o status da tarefa de Pendente para Em andamento` |
| `ADD + MEMBERS`, `userkey.newValue = "ana.silva"` | `adicionou ana.silva ao projeto` |
| `REMOVE + MEMBERS`, `userkey.oldValue = "ana.silva"` | `removeu ana.silva do projeto` |
| `COMMENT + COMMENTS` | `adicionou um comentário` |
| `SYSTEM_UPDATE + TASKS`, `delayed: false → true` | `marcou automaticamente a tarefa como atrasada` |

Os valores de domínio também precisam de tradução no front. Por exemplo:

```typescript
const taskStageLabels: Record<string, string> = {
  STARTED: "Iniciada",
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  REVIEW: "Em revisão",
  DONE: "Concluída",
};
```

### Fallback obrigatório

O sistema continuará evoluindo. Um enum, recurso ou campo novo não pode quebrar a timeline.

Se não houver template específico:

1. usar o rótulo genérico de ação e recurso;
2. mostrar `resourcekey` apenas como identificador secundário, nunca como texto principal quando houver nome/título em `changes`;
3. renderizar alterações conhecidas como `valor anterior → valor novo`;
4. para objetos e arrays, usar resumo legível ou painel de detalhes, e não `[object Object]`;
5. se a estrutura de `changes` for inválida, ignorar o detalhe e manter a mensagem genérica.

Valores `null` podem ser exibidos como `Não definido`. Booleanos devem usar rótulos relacionados ao campo quando possível, como `Sim/Não` ou `Atrasada/No prazo`.

Não renderizar conteúdo de `changes` como HTML. Todo valor deve permanecer texto escapado pelo React.

---

## Filtros e paginação

Para a primeira versão da sidebar do dashboard, carregar:

```typescript
AuditLogService.list(orgId, { page: 1, limit: 20 });
```

Uma página completa de histórico pode oferecer:

* ator;
* ação;
* recurso;
* intervalo de datas;
* botão para limpar filtros.

Regras:

* alterar qualquer filtro volta para `page = 1`;
* datas devem ser enviadas como ISO 8601;
* não enviar query params vazios;
* `resourcekey` é indicado para telas de detalhe, como histórico de uma tarefa;
* paginação pode usar `Carregar mais` ou scroll infinito, mas não deve repetir IDs;
* ao concatenar páginas, deduplicar por `log.id` e preservar `created_at DESC`.

Na sidebar, filtros avançados podem ficar fora da V1. A consulta por organização e o carregamento incremental são suficientes.

---

## Estrutura dos mocks

O front atual alterna entre serviços reais e mocks com `dotenv.USE_MOCKS`. Audit log deve seguir exatamente esse mecanismo, sem adicionar MSW ou uma segunda estratégia de mock apenas para este módulo.

Estrutura sugerida:

```text
src/service/
├── mock/
│   ├── audit-log/
│   │   └── audit-log.mock.ts
│   └── data.ts
├── modules/
│   └── audit-log/
│       └── audit-log.service.ts
└── types/
    └── audit-log/
        ├── audit-log.dto.ts
        └── audit-log.query.dto.ts
```

Adicionar `auditLogs: AuditLogDTO[]` a `MockDataShape` e `auditLog` às chaves aceitas por `createMockId`.

### Factory

```typescript
export function createMockAuditLog(
  data: Partial<AuditLogDTO> = {},
): AuditLogDTO {
  return {
    id: data.id ?? "aud-000",
    orgkey: data.orgkey ?? "org-000",
    actorkey: data.actorkey !== undefined ? data.actorkey : "usuario.mock",
    actorType: data.actorType ?? "USER",
    action: data.action ?? "UPDATE",
    resource: data.resource ?? "TASKS",
    resourcekey: data.resourcekey !== undefined ? data.resourcekey : "tsk-000",
    changes: data.changes ?? {},
    created_at: data.created_at ?? "2026-07-21T18:00:00.000Z",
    actor: data.actor !== undefined
      ? data.actor
      : {
          username: "usuario.mock",
          name: "Usuário Mock",
          photo: null,
        },
  };
}
```

Para um log de sistema, sobrescrever os campos de forma consistente:

```typescript
createMockAuditLog({
  actorkey: null,
  actor: null,
  actorType: "SYSTEM",
  action: "SYSTEM_UPDATE",
});
```

### Dados mínimos do seed

Os seeds devem cobrir, no mínimo:

* ação de usuário e ação de sistema;
* ator com foto, sem foto e removido;
* `changes` vazio;
* string, número, booleano, `null`, array e objeto em `changes`;
* criação, atualização, exclusão, adição, remoção, comentário e mudança de status;
* mais de uma organização para validar isolamento;
* mais itens do que o `limit` para validar paginação;
* datas em dias diferentes e fora de ordem no array original;
* recurso ou campo sem template específico para validar fallback.

Exemplos:

```typescript
const auditLogs: AuditLogDTO[] = [
  createMockAuditLog({
    id: "aud-001",
    orgkey: "org-001",
    actorkey: "ana.silva",
    actorType: "USER",
    actor: {
      username: "ana.silva",
      name: "Ana Silva",
      photo: null,
    },
    action: "STATUS_CHANGE",
    resource: "TASKS",
    resourcekey: "tsk-001",
    changes: {
      stage: { oldValue: "PENDING", newValue: "IN_PROGRESS" },
      name: { oldValue: "Criar login", newValue: "Criar login seguro" },
    },
    created_at: "2026-07-21T17:45:00.000Z",
  }),
  createMockAuditLog({
    id: "aud-002",
    orgkey: "org-001",
    actorkey: null,
    actorType: "SYSTEM",
    actor: null,
    action: "SYSTEM_UPDATE",
    resource: "TASKS",
    resourcekey: "tsk-002",
    changes: {
      delayed: { oldValue: false, newValue: true },
    },
    created_at: "2026-07-21T16:30:00.000Z",
  }),
  createMockAuditLog({
    id: "aud-003",
    orgkey: "org-002",
    actorkey: "bruno.lima",
    action: "CREATE",
    resource: "PROJECTS",
    resourcekey: "pro-008",
    changes: {
      title: { oldValue: null, newValue: "Portal do cliente" },
    },
    created_at: "2026-07-20T14:00:00.000Z",
  }),
];
```

O array pode estar fora de ordem para garantir que o mock service realmente aplique `created_at DESC`.

### Comportamento do mock service

`AuditLogMockService.list()` deve se comportar como o endpoint esperado:

1. montar o path `/org/${orgId}/audit-logs`;
2. chamar `requireMockOrgRequest(path, mockData.affiliations)`;
3. rejeitar quando o `orgId` for diferente do `orgkey` do contexto;
4. filtrar obrigatoriamente por `orgkey` antes dos demais filtros;
5. aplicar comparações exatas para `actorkey`, `action`, `resource` e `resourcekey`;
6. aplicar o intervalo de datas sobre `created_at`;
7. ordenar por `created_at DESC`;
8. paginar depois de filtrar e ordenar;
9. devolver um novo array, sem mutar `mockData.auditLogs`.

Esqueleto:

```typescript
export class AuditLogMockService implements AuditLogServiceI {
  async list(
    orgId: string,
    query: AuditLogQueryDTO = {},
  ): Promise<ApiResponse<AuditLogPageDTO>> {
    const path = `/org/${orgId}/audit-logs`;
    const context = requireMockOrgRequest(path, mockData.affiliations);

    if (context.orgkey !== orgId) {
      throw createMockRequestError(
        path,
        403,
        "A organização da rota difere da organização selecionada.",
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filtered = mockData.auditLogs
      .filter((log) => log.orgkey === orgId)
      .filter((log) => !query.actorkey || log.actorkey === query.actorkey)
      .filter((log) => !query.action || log.action === query.action)
      .filter((log) => !query.resource || log.resource === query.resource)
      .filter((log) => !query.resourcekey || log.resourcekey === query.resourcekey)
      .filter((log) => !query.startDate || log.created_at >= query.startDate)
      .filter((log) => !query.endDate || log.created_at <= query.endDate)
      .sort((left, right) => (
        new Date(right.created_at).getTime()
        - new Date(left.created_at).getTime()
      ));

    const total = filtered.length;
    const start = (page - 1) * limit;

    return createMockResponse({
      items: filtered.slice(start, start + limit),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }, path, "Logs de auditoria listados com sucesso.");
  }
}
```

O exemplo pressupõe datas ISO normalizadas. Se o formulário permitir offsets variados, comparar timestamps com `Date.parse()`.

O mock deve validar `page >= 1` e `1 <= limit <= 100` para reproduzir o DTO do backend. Requisições inválidas devem rejeitar com `createMockRequestError(..., 400, ...)`, não retornar uma resposta de sucesso com `error: true`.

---

## Integração no dashboard

No `useOrganizerDashboard`, a timeline deve passar a vir de uma única consulta:

```typescript
const [listedProjects, auditLogs] = await Promise.all([
  ProjectService.list(),
  AuditLogService.list(orgId, { page: 1, limit: 20 }),
]);
```

Comentários e membros só devem ser consultados quando ainda forem necessários para outras partes do dashboard. Não realizar uma chamada de comentários por projeto para reconstruir atividades que já pertencem ao audit log.

O tipo de `OrganizerDashboardData.updates` deve deixar de ser `CommentDTO[]` e passar a ser `AuditLogDTO[]`, ou a timeline deve receber um view model derivado:

```typescript
interface AuditLogItemViewModel {
  id: string;
  actorName: string;
  actorUsername: string | null;
  actorPhotoUrl: string | null;
  message: string;
  resourceLabel: string;
  occurredAt: string;
  details: Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }>;
}
```

É preferível converter `AuditLogDTO` para esse view model fora do componente visual. Assim, `UpdateCard` não conhece enums do backend e pode continuar simples.

---

## Cenários de verificação

Antes de considerar a implementação do front concluída, verificar:

1. logs da organização A nunca aparecem ao selecionar a organização B;
2. a timeline chega ordenada do mais recente para o mais antigo;
3. usuário, sistema e usuário removido possuem apresentações diferentes;
4. `STATUS_CHANGE` mostra valor anterior e novo traduzidos;
5. `changes: {}` ainda gera uma mensagem útil;
6. valores `null`, arrays e objetos não quebram a renderização;
7. enum ou campo desconhecido usa fallback;
8. loading, vazio, erro e retry são visíveis;
9. próxima página não duplica itens;
10. troca rápida de organização não exibe resposta antiga;
11. filtros voltam para a primeira página;
12. o modo mock e o serviço real entregam o mesmo tipo ao componente.

---

## Limites da implementação do front

O front-end não deve:

* criar, alterar ou excluir logs; seu acesso ao audit log é exclusivamente de leitura;
* enviar `actorkey`, `orgkey`, `actorType` ou `changes` para criar um log;
* inventar logs depois de uma mutação local para substituir a auditoria do backend;
* persistir mensagens prontas dentro de `mockData.auditLogs`;
* inferir acesso apenas pelo conteúdo da rota;
* misturar logs de organizações para depois filtrar apenas na interface;
* depender de todos os campos de `changes` estarem presentes;
* exibir JSON bruto como conteúdo principal da timeline;
* usar `dangerouslySetInnerHTML` para valores vindos do log.

O contrato central do front deve permanecer:

```text
AuditLog estruturado
        ↓
formatter / view model
        ↓
timeline traduzida e resiliente
```

Isso permite alterar textos, traduções e apresentação sem mudar dados persistidos no backend.
