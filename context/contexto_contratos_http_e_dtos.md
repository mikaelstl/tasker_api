# Contratos HTTP e convenções de DTO

Este documento complementa os contextos de cada módulo com regras comuns para o frontend.

## Envelope de sucesso

Todos os handlers que produzem JSON retornam o envelope:

```ts
interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  path: string;
  timestamp: string; // ISO 8601
}
```

Isso inclui os endpoints de status (`GET /status` e `GET /auth`) e as operações
de busca, edição e exclusão de Tasks e Events, que anteriormente retornavam
valores diretamente.

Nos controllers, a resposta deve ser finalizada sempre com:

```ts
return response.status(ApiResponse.status).json(ApiResponse);
```

O status HTTP deve vir do mesmo objeto enviado no corpo. Não use nomes
alternativos como `resp`, `payload` ou `body` para esse envelope.

Exceção atual:

- `POST /project/:id/stats/report` retorna bytes de PDF com
  `Content-Type: application/pdf`; por ser download binário, não usa
  `ApiResponse`.

Operações que devolvem um envelope não devem usar `204 No Content`, pois esse
status elimina o corpo da resposta. A remoção de afiliação usa `200` para
preservar o JSON padronizado.

## Envelope de erro

Os filtros globais também derivam o status do objeto enviado e finalizam a
resposta com a mesma convenção:

```ts
return response.status(ApiResponse.status).json(ApiResponse);
```

```ts
type ErrorLevel = "info" | "warning" | "error" | "critical" | "validation";

interface ApiErrorItem {
  level: ErrorLevel;
  message: string;
  details?: string;
  error?: string;
}

interface ApiError {
  status: number;
  errors: ApiErrorItem[];
  timestamp: string;
  path: string;
}
```

Erros de validação usam `level: "validation"`, regras de negócio usam
`level: "warning"` e falhas internas usam `level: "critical"`. A UI deve exibir
`errors[].message` e possuir fallback para erro fora desse formato.

## Datas

- Campos `Date` são serializados como strings ISO 8601.
- Envie datas também em ISO 8601, preferencialmente com timezone (`Z` ou offset).
- Não tipar respostas JSON como `Date` no frontend; use `string` e converta apenas na camada de apresentação.

## DTO de classe versus interface

O `ValidationPipe` global usa:

```ts
{
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true
}
```

Porém, validação em runtime só funciona quando o DTO é uma classe com decorators. Muitos DTOs do projeto são `interface` ou `type`, que desaparecem na compilação. Assim:

- `CreateAccountDTO`, `CreateUserDTO`, `OrganizationCreateDTO`, `LoginDTO` e DTOs HTTP de Stats possuem validação parcial/real;
- DTOs de Affiliation, Project, Member, Task, Comment e Event não validam seus campos em runtime;
- o frontend deve validar para UX, mas validação e autorização definitivas continuam sendo responsabilidade do backend.

## Autenticação e organização ativa

```http
Authorization: Bearer <access_token>
x-org-key: <organization-id>
```

O header `x-org-key` é exigido em rotas que passam pelo `PermissionGuard`. Não o envie em cadastro/login e ele não é necessário ao criar uma organização. O papel da sessão deve vir de `GET /affiliations` para a organização ativa.

## Identificadores que não devem ser confundidos

```text
Account.id
  └─ JWT.sub e User.accountkey

User.username
  └─ Affiliation.userkey, Organization.ownerkey, Comment.ownerkey

Affiliation.id
  └─ Project.managerkey e Member.userkey

Member.id
  └─ Task.ownerkey
```

Essa distinção é essencial ao montar selectors de gestor, membro e responsável por tarefa.

## Enums de transporte

```ts
type OrgRole = "OWNER" | "MANAGER" | "MEMBER";
type ProjectStage = "STARTED" | "PENDING" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";
type TaskStage = "STARTED" | "PENDING" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
type EventCategory = "RELEASE" | "MEETING" | "REVIEW" | "PLANNING" | "TESTS" | "LAUNCH";
type StatsPeriodType = "WEEK" | "MONTH" | "QUARTER";
type ProjectHealthStatus = "SAFE" | "WARNING" | "CRITICAL";
```

Não traduza os literais no transporte. Faça o mapeamento para rótulos apenas na UI.
