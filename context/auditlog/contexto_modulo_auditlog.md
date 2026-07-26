# Contexto do módulo Audit Log

## Estado atual

O módulo possui model Prisma, DTOs internos e serviço de gravação, mas não possui endpoint implementado. O controller declara o prefixo `/org/:id/audit-logs` e não contém handlers.

Consequências:

- não existe `GET /org/:id/audit-logs` funcional;
- não existe endpoint público de criação, o que é intencional;
- o frontend deve usar mocks até a consulta ser implementada;
- os demais módulos ainda não chamam `AuditLogService.log()`, então a timeline real permanece sem alimentação.

## Endpoints

| Método | Rota | Estado | Retorno |
| --- | --- | --- | --- |
| `GET` | `/org/:id/audit-logs` | planejado, não implementado | paginação ainda não definida no backend |
| `POST` | `/audit-logs` | não deve existir | logs são internos |

O contrato sugerido para a futura consulta continua documentado em `contexto_frontend_auditlog.md`, mas não deve ser confundido com contrato disponível.

## Model/DTO de saída esperado

```ts
type AuditActorType = "USER" | "SYSTEM";

type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ADD"
  | "REMOVE"
  | "COMMENT"
  | "STATUS_CHANGE"
  | "SYSTEM_UPDATE";

type AuditResource =
  | "ORGS"
  | "AFFILIATIONS"
  | "PROJECTS"
  | "MEMBERS"
  | "TASKS"
  | "COMMENTS"
  | "EVENTS"
  | "PROJECT_STATS";

type AuditLogChangeValue =
  | string
  | number
  | boolean
  | null
  | AuditLogChangeValue[]
  | { [key: string]: AuditLogChangeValue };

type AuditLogChanges = Record<string, {
  oldValue: AuditLogChangeValue;
  newValue: AuditLogChangeValue;
}>;

interface AuditLogDTO {
  id: string;
  orgkey: string;
  actorkey: string | null;
  actorType: AuditActorType;
  action: AuditAction;
  resource: AuditResource;
  resourcekey: string | null;
  changes: AuditLogChanges;
  created_at: string;
}
```

Se a futura consulta incluir a relação do ator, ela deve ser adicionada explicitamente ao contrato, por exemplo:

```ts
interface AuditLogWithActorDTO extends AuditLogDTO {
  actor: {
    username: string;
    name: string;
    photo: { url: string } | null;
  } | null;
}
```

## DTO interno de criação

Não é body HTTP. É usado somente por serviços do backend.

```ts
type CreateAuditLogInput = {
  orgkey: string;
  actorkey?: string | null;
  actorType: AuditActorType;
  action: AuditAction;
  resource: AuditResource;
  resourcekey?: string | null;
  changes?: AuditLogChanges;
};
```

Regras aplicadas por `AuditLogService.log()`:

- `USER` exige `actorkey`;
- `SYSTEM` proíbe `actorkey`;
- `changes` deve ser objeto simples;
- cada campo deve conter exatamente `oldValue` e `newValue`;
- quando omitidos, `actorkey`/`resourcekey` viram `null` e `changes` vira `{}`.

Exemplo interno:

```ts
await auditLogService.log({
  orgkey,
  actorkey: account.username,
  actorType: "USER",
  action: "STATUS_CHANGE",
  resource: "TASKS",
  resourcekey: task.id,
  changes: {
    stage: { oldValue: "PENDING", newValue: "IN_PROGRESS" }
  }
});
```

## DTO de query já criado, mas ainda não conectado

```ts
class FindAuditLogsQuery {
  actorkey?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resourcekey?: string;
  startDate?: string; // ISO 8601
  endDate?: string;   // ISO 8601
  page: number = 1;   // inteiro >= 1
  limit: number = 20; // inteiro entre 1 e 100
}
```

O DTO é uma classe com validação e conversão numérica de `page`/`limit`, porém nada o consome hoje.

## Contrato recomendado para a futura consulta

```ts
interface AuditLogPageDTO {
  items: AuditLogWithActorDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

```http
GET /org/:id/audit-logs?resource=TASKS&page=1&limit=20
Authorization: Bearer <token>
x-org-key: <mesmo-id-da-rota>
```

A implementação deve filtrar sempre por `orgkey`, validar que header e parâmetro representam a mesma organização e ordenar por `created_at DESC`.

## Regras de integração

- O ator de ação humana vem de `CurrentAccount.username`, nunca do body.
- A organização vem do contexto autorizado; não deve ser livremente escolhida no payload.
- Não registrar senha, token ou segredo em `changes`.
- O backend armazena fatos estruturados; textos/traduções da timeline são montados pelo frontend.
- Idealmente, mutação e log participam da mesma transação.
