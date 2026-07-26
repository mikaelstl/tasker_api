# Contexto do schema, DTOs e mocks

Fonte-base:
- `prisma/schema.prisma`
- `src/modules/*/dto/*.ts`
- comportamento observado em `src/modules/*/*.repository.ts`

Objetivo:
- registrar as relacoes entre entidades
- exemplificar dados validos por tabela
- definir como dados mockados devem funcionar neste projeto

## Regras globais do modelo

- `Account` autentica o usuario e referencia `User` por `accountkey`
- `User` usa `username` como chave primaria no schema atual
- `Organization` pertence a um unico `User` por `ownerkey`
- `Affiliation` liga `User` e `Organization` e define o papel do usuario na organizacao
- `Project` pertence a uma `Organization` e pode ter um `Affiliation` como manager
- `Member` liga `Project` e `Affiliation`
- `Task` pertence a `Project` e tem um `Member` como owner
- `Comment` pertence a `Project` e a um `User`
- `Event` pertence a `Project`
- `Image` pertence a um `User`
- `Notification` pertence a um `User` por `actorkey`

## Entidades

### Account

Schema:
- tabela: `accounts`
- campos: `id`, `password`, `email`, `created_at`, `updated_at`
- relacao: 1 `Account` pode ter 0 ou 1 `User`

Contexto:
- esta entidade guarda credenciais
- `email` e unico
- `password` deve ser tratado como segredo e nunca exposto em mocks de resposta publica

Exemplo de dado:
```json
{
  "id": "ckxacc01a0001",
  "email": "ana@tasker.dev",
  "password": "Senha@123",
  "created_at": "2026-07-14T10:00:00.000Z",
  "updated_at": "2026-07-14T10:00:00.000Z"
}
```

DTOs relacionados:
- `src/modules/accounts/dto/account.dto.ts`
- `src/modules/accounts/dto/create.dto.ts`

### User

Schema:
- tabela: `users`
- campos: `id`, `username`, `name`, `accountkey`, `created_at`, `updated_at`
- relacoes:
  - `accountkey -> Account.id`
  - 1 `User` pode ter 0 ou 1 `Image`
  - 1 `User` pode ter varios `Comment`
  - 1 `User` pode ter varias `Notification`
  - 1 `User` pode ter varias `Affiliation`
  - 1 `User` pode ter 0 ou 1 `Organization` como owner

Contexto:
- `username` e a chave primaria do usuario no schema atual
- `accountkey` e obrigatorio e aponta para a conta que criou o usuario
- `name` e o nome exibido

Exemplo de dado:
```json
{
  "id": "ckxusr01a0001",
  "username": "ana.silva",
  "name": "Ana Silva",
  "accountkey": "ckxacc01a0001",
  "created_at": "2026-07-14T10:01:00.000Z",
  "updated_at": "2026-07-14T10:01:00.000Z"
}
```

DTOs relacionados:
- `src/modules/users/dto/create.dto.ts`
- `src/modules/users/dto/user.dto.ts`
- `src/modules/users/dto/current-account.dto.ts`
- `src/modules/users/dto/user-query.dto.ts`
- `src/modules/users/dto/edit-user.dto.ts`

### Organization

Schema:
- tabela: `organizations`
- campos: `id`, `name`, `ownerkey`, `created_at`, `updated_at`
- relacoes:
  - `ownerkey -> User.username`
  - 1 `Organization` pode ter varios `Project`
  - 1 `Organization` pode ter varias `Affiliation`

Contexto:
- cada organizacao tem um unico dono
- o dono e um `User` identificado por `username`
- a organizacao e o ponto de agregacao para projetos e membros

Exemplo de dado:
```json
{
  "id": "ckxorg01a0001",
  "name": "Tasker Studio",
  "ownerkey": "ana.silva",
  "created_at": "2026-07-14T10:02:00.000Z",
  "updated_at": "2026-07-14T10:02:00.000Z"
}
```

DTOs relacionados:
- `src/modules/organization/dto/create.dto.ts`
- `src/modules/organization/dto/organization.dto.ts`

### Affiliation

Schema:
- tabela: `affiliations`
- campos: `id`, `orgkey`, `userkey`, `role`, `created_at`, `updated_at`
- relacoes:
  - `orgkey -> Organization.id`
  - `userkey -> User.username`
  - 1 `Affiliation` pode ter varios `Member`
  - 1 `Affiliation` pode gerir varios `Project`
- restricao unica:
  - `@@unique([userkey, orgkey])`

Contexto:
- representa a participacao de um usuario em uma organizacao
- define o papel do usuario na organizacao: `OWNER`, `MANAGER` ou `MEMBER`
- nao pode haver duplicidade para o mesmo par usuario + organizacao

Exemplo de dado:
```json
{
  "id": "ckxaff01a0001",
  "orgkey": "ckxorg01a0001",
  "userkey": "ana.silva",
  "role": "OWNER",
  "created_at": "2026-07-14T10:03:00.000Z",
  "updated_at": "2026-07-14T10:03:00.000Z"
}
```

DTOs relacionados:
- `src/modules/affiliations/dto/define.dto.ts`
- `src/modules/affiliations/dto/affiliation.dto.ts`
- `src/modules/affiliations/dto/edit.dto.ts`
- `src/modules/affiliations/dto/query.dto.ts`
- `src/modules/affiliations/dto/summary.dto.ts`

### Image

Schema:
- tabela: `images`
- campos: `id`, `filename`, `url`, `userkey`, `created_at`, `updated_at`
- relacao:
  - `userkey -> User.username`
  - cada `User` pode ter no maximo 1 `Image`

Contexto:
- representa a imagem de perfil do usuario
- `userkey` e unico, entao uma imagem substitui a anterior para o mesmo usuario

Exemplo de dado:
```json
{
  "id": "ckximg01a0001",
  "filename": "ana-avatar.png",
  "url": "https://cdn.tasker.dev/images/ana-avatar.png",
  "userkey": "ana.silva",
  "created_at": "2026-07-14T10:04:00.000Z",
  "updated_at": "2026-07-14T10:04:00.000Z"
}
```

DTOs relacionados:
- `src/modules/upload/dto/image.create.dto.ts`

### Project

Schema:
- tabela: `projects`
- campos Prisma: `id`, `title`, `description`, `deadline`, `started_at`, `done_at`, `delayed`, `stage`, `orgkey`, `managerkey`, `created_at`, `updated_at`
- relacoes:
  - `orgkey -> Organization.id`
  - `managerkey -> Affiliation.id` opcional
  - 1 `Project` pode ter varios `Member`
  - 1 `Project` pode ter varios `Comment`
  - 1 `Project` pode ter varias `Task`
  - 1 `Project` pode ter varios `Event`

Contexto:
- pertence a uma organizacao
- pode ter um gerente especifico via afiliacao
- usa `ProjectStage` como estado de andamento

Exemplo de dado:
```json
{
  "id": "ckxpro01a0001",
  "title": "Portal de atendimento",
  "description": "Entrega da primeira versao do portal interno",
  "deadline": "2026-08-01T00:00:00.000Z",
  "started_at": "2026-07-14T10:05:00.000Z",
  "done_at": null,
  "delayed": false,
  "stage": "IN_PROGRESS",
  "orgkey": "ckxorg01a0001",
  "managerkey": "ckxaff01a0001",
  "created_at": "2026-07-14T10:05:00.000Z",
  "updated_at": "2026-07-14T10:05:00.000Z"
}
```

DTOs relacionados:
- `src/modules/projects/dto/project.create.dto.ts`
- `src/modules/projects/dto/project.dto.ts`
- `src/modules/projects/dto/project.query.dto.ts`
- `src/modules/projects/dto/edit.dto.ts`

### Member

Schema:
- tabela: `member`
- campos: `id`, `projectkey`, `userkey`, `created_at`, `updated_at`
- relacoes:
  - `projectkey -> Project.id`
  - `userkey -> Affiliation.id`
  - 1 `Member` pode ter varias `Task`

Contexto:
- representa um integrante alocado em um projeto
- a ligacao do membro nao e direta com `User`, e sim com `Affiliation`
- isso permite respeitar o contexto organizacional do usuario

Exemplo de dado:
```json
{
  "id": "ckxmem01a0001",
  "projectkey": "ckxpro01a0001",
  "userkey": "ckxaff01a0001",
  "created_at": "2026-07-14T10:06:00.000Z",
  "updated_at": "2026-07-14T10:06:00.000Z"
}
```

DTOs relacionados:
- `src/modules/members/dto/member.create.dto.ts`
- `src/modules/members/dto/member.dto.ts`
- `src/modules/members/dto/role.dto.ts`

### Task

Schema:
- tabela: `tasks`
- campos: `id`, `code`, `name`, `description`, `due_date`, `stage`, `priority`, `projectkey`, `ownerkey`, `created_at`, `updated_at`
- relacoes:
  - `projectkey -> Project.id`
  - `ownerkey -> Member.id`

Contexto:
- a tarefa pertence a um projeto
- o responsavel e um `Member`, nao um `User`
- `code` e uma identificacao publica curta com prefixo `TSK-`
- `stage` controla o fluxo da tarefa
- `priority` controla a urgencia

Exemplo de dado:
```json
{
  "id": "ckxtsk01a0001",
  "code": "TSK-A1B2C3",
  "name": "Validar login",
  "description": "Revisar fluxo de autenticacao e mensagens de erro",
  "due_date": "2026-07-20T00:00:00.000Z",
  "stage": "PENDING",
  "priority": "HIGH",
  "projectkey": "ckxpro01a0001",
  "ownerkey": "ckxmem01a0001",
  "created_at": "2026-07-14T10:07:00.000Z",
  "updated_at": "2026-07-14T10:07:00.000Z"
}
```

DTOs relacionados:
- `src/modules/tasks/dto/task.create.dto.ts`
- `src/modules/tasks/dto/task.dto.ts`
- `src/modules/tasks/dto/task.query.dto.ts`

### Comment

Schema:
- tabela: `comments`
- campos: `id`, `content`, `date`, `ownerkey`, `projectkey`, `created_at`, `updated_at`
- relacoes:
  - `ownerkey -> User.username`
  - `projectkey -> Project.id`

Contexto:
- comentario pertence a um projeto e a um autor
- o autor e guardado por `username`
- `date` representa o momento de publicacao do comentario

Exemplo de dado:
```json
{
  "id": "ckxcom01a0001",
  "content": "Entrega aprovada para a primeira revisao.",
  "date": "2026-07-14T10:08:00.000Z",
  "ownerkey": "ana.silva",
  "projectkey": "ckxpro01a0001",
  "created_at": "2026-07-14T10:08:00.000Z",
  "updated_at": "2026-07-14T10:08:00.000Z"
}
```

DTOs relacionados:
- `src/modules/comments/dto/comment.create.dto.ts`
- `src/modules/comments/dto/comment.dto.ts`
- `src/modules/comments/dto/comment.query.dto.ts`

### Event

Schema:
- tabela: `events`
- campos: `id`, `title`, `date`, `projectkey`, `category`, `created_at`, `updated_at`
- relacao:
  - `projectkey -> Project.id`

Contexto:
- evento e uma data marcada do projeto
- `category` classifica o evento em `RELEASE`, `MEETING`, `REVIEW`, `PLANNING`, `TESTS` ou `LAUNCH`

Exemplo de dado:
```json
{
  "id": "ckxevt01a0001",
  "title": "Revisao de sprint",
  "date": "2026-07-18T14:00:00.000Z",
  "projectkey": "ckxpro01a0001",
  "category": "REVIEW",
  "created_at": "2026-07-14T10:09:00.000Z",
  "updated_at": "2026-07-14T10:09:00.000Z"
}
```

DTOs relacionados:
- `src/modules/events/dto/event.create.dto.ts`
- `src/modules/events/dto/event.dto.ts`
- `src/modules/events/dto/event.query.dto.ts`

### Notification

Schema:
- tabela: `notifications`
- campos: `id`, `action`, `actorkey`, `created_at`, `updated_at`
- relacao:
  - `actorkey -> User.username`

Contexto:
- notificacao registra uma acao associada a um usuario
- no schema atual nao existe payload estruturado alem de `action`

Exemplo de dado:
```json
{
  "id": "ckxnot01a0001",
  "action": "User created a new project",
  "actorkey": "ana.silva",
  "created_at": "2026-07-14T10:10:00.000Z",
  "updated_at": "2026-07-14T10:10:00.000Z"
}
```

DTOs relacionados:
- nao ha DTO em `src/modules/notifications`, apenas o modelo Prisma

## DTOs por modulo

### Accounts

- `AccountDTO`
  - `id?`
  - `email`
  - `password`
- `CreateAccountDTO`
  - `email`
  - `password`

### Users

- `CreateUserDTO`
  - `name`
  - `username`
  - `orgkey?`
  - `accountkey`
- `UserDTO`
  - `id?`
  - `name`
  - `username`
  - `accountkey`
- `CurrentAccountDTO`
  - `id`
  - `username`
  - `email`
- `UserQueryDTO`
  - `id?`
  - `name?`
  - `username?`
  - `orgkey?`
  - `accountkey`
  - `member_in?`
- `edit-user.dto.ts`
  - arquivo exporta `UserQueryDTO`, nao um DTO de edicao separado

### Organizations

- `OrganizationCreateDTO`
  - `name`
  - `ownerkey?`
- `OrganizationDTO`
  - `id`
  - `name`
  - `ownerkey`
  - `owner?`
  - `projects?`
  - `members?`
  - `created_at`
  - `updated_at`

### Affiliations

- `DefineAffiliationDTO`
  - `orgkey`
  - `userkey`
  - `role?`
- `AffiliationDTO`
  - `id`
  - `orgkey`
  - `userkey`
  - `org?`
  - `user?`
  - `role`
- `AffiliationEditDTO`
  - `orgkey?`
  - `userkey?`
  - `role?`
- `AffiliationQuery`
  - `id?`
  - `orgkey?`
  - `userkey?`
  - `role?`
- `UserOrganizationSummaryDTO`
  - `orgkey`
  - `role`
  - `name`
  - `projects`
  - `members`

Nota:
- `AffiliationDTO.user` aponta para `OrganizationDTO` no codigo atual, mas o contexto de dominio indica que o esperado e um usuario. Trate isso como inconsistencia do DTO ao montar mocks ou docs derivados.

### Projects

- `CreateProjectDTO`
  - `title`
  - `description`
  - `ownerkey`
  - `due_date`
- `EditProjectDTO`
  - `title?`
  - `description?`
  - `due_date?`
  - `progress?`
- `ProjectDTO`
  - `id`
  - `title`
  - `description?`
  - `ownerkey?`
  - `due_date?`
  - `progress?`
  - `members?`
- `ProjectQueryDTO`
  - `id?`
  - `title?`
  - `description?`
  - `ownerkey?`
  - `managerkey?`
  - `due_date?`
  - `progress?`

Nota:
- `ProjectDTO.members` esta tipado como `MemberDTO`, mas o relacionamento do schema e um array. Em mocks, use lista quando o retorno vier com `include`.

### Members

- `DefineMemberDTO`
  - `project`
  - `user`
- `MemberDTO`
  - `id`
  - `projectkey`
  - `userkey`
  - `user`
  - `tasks`
  - `role`
- `MemberRole`
  - `OWNER`
  - `MEMBER`

### Tasks

- `TaskCreateDTO`
  - `name`
  - `description`
  - `project`
  - `owner`
  - `priority`
  - `due_date`
- `TaskDTO`
  - `id`
  - `code`
  - `name`
  - `description`
  - `projectkey`
  - `ownerkey`
  - `stage`
  - `priority`
  - `due_date`
- `TaskQueryDTO`
  - `code?`
  - `name?`
  - `projectkey?`
  - `ownerkey?`
  - `stage?`
  - `priority?`
  - `due_date?`

### Comments

- `CreateCommentDTO`
  - `content`
  - `date`
  - `ownerkey`
  - `projectkey`
- `CommentDTO`
  - `id`
  - `content`
  - `date`
  - `ownerkey`
  - `projectkey`
- `CommentQueryDTO`
  - `id?`
  - `projectkey?`
  - `ownerkey?`
  - `date?`

### Events

- `EventCreateDTO`
  - `title`
  - `project`
  - `date`
  - `category`
- `EventDTO`
  - `id`
  - `title`
  - `projectkey`
  - `date`
- `EventQueryDTO`
  - `id?`
  - `title?`
  - `projectkey?`
  - `date?`

### Upload

- `CreateImageDTO`
  - `filename`
  - `url`
  - `userkey`

## Como os dados mockados devem funcionar

### 1. Devem respeitar a ordem das dependencias

Sequencia segura para montar um dataset base:
1. `Account`
2. `User`
3. `Organization`
4. `Affiliation`
5. `Image`
6. `Project`
7. `Member`
8. `Task`
9. `Comment`
10. `Event`
11. `Notification`

Motivo:
- as FKs dependem de registros anteriores
- isso evita mocks com chaves inexistentes

### 2. Devem preservar unicidade

Regras obrigatorias:
- `Account.email` unico
- `User.username` unico
- `Organization.ownerkey` unico
- `Affiliation` unico por par `userkey + orgkey`
- `Image.userkey` unico
- `Task.code` unico
- `Task.id` unico
- `Event.id` unico
- `Notification.id` unico

### 3. Devem manter coerencia entre tabela e DTO

Regra:
- quando o DTO de criacao usa nome diferente do schema, o mock deve mapear para o campo persistido

Mapeamentos observados:
- `EventCreateDTO.project -> Event.projectkey`
- `DefineMemberDTO.project -> Member.projectkey`
- `DefineMemberDTO.user -> Member.userkey`
- `TaskCreateDTO.project -> Task.projectkey`
- `TaskCreateDTO.owner -> Task.ownerkey`
- `CreateProjectDTO.ownerkey -> Project.orgkey` (mapeamento legado no controller; o DTO ainda usa o nome antigo)
- `CreateCommentDTO.ownerkey -> Comment.ownerkey`
- `CreateCommentDTO.projectkey -> Comment.projectkey`

### 4. Devem refletir o tipo real do retorno

Regra:
- se o repository retorna `findMany`, o mock deve retornar lista
- se o repository inclui relacoes, o mock deve incluir essas relacoes quando o caso de uso pedir
- se o repository devolve objeto bruto do Prisma, o mock deve espelhar esse objeto, nao uma view idealizada

Exemplos:
- `MembersRepository.list` retorna membros com `tasks`
- `OrganizationRepository.find` inclui `members`
- `OrganizationRepository.delete` inclui `projects` e `members`
- `ProjectRepository.find` inclui `members`
- `TasksRepository.find` inclui `owner`

### 5. Devem preservar formatos de data

Regra:
- usar datas em ISO 8601 nos exemplos e fixtures
- campos `DateTime` do Prisma devem estar coerentes entre si
- para mocks de entrada, strings ISO sao aceitaveis se o consumo converte antes de persistir

### 6. Devem respeitar os campos opcionais

Regra:
- nao preencher `managerkey` quando o projeto nao tiver gerente
- nao inventar `Image`
- nao inventar `owner` ou `members` aninhados se o endpoint nao fizer include

### 7. Devem refletir a semantica dos enums

Valores validos:
- `ProjectStage`: `STARTED`, `PENDING`, `IN_PROGRESS`, `PAUSED`, `COMPLETED`
- `EventCategory`: `RELEASE`, `MEETING`, `REVIEW`, `PLANNING`, `TESTS`, `LAUNCH`
- `OrgRole`: `OWNER`, `MANAGER`, `MEMBER`
- `TaskStage`: `STARTED`, `PENDING`, `IN_PROGRESS`, `REVIEW`, `DONE`
- atraso é representado separadamente pelos booleanos `Project.delayed` e `Task.delayed`
- `TaskPriority`: `LOW`, `MEDIUM`, `HIGH`, `EXTREME`

### 8. Devem manter a cadeia de propriedade do dominio

Exemplo coerente:
- `Account` cria `User`
- `User` pode criar `Organization`
- `Organization` recebe `Affiliation`
- `Affiliation` vira `Member`
- `Member` recebe `Task`
- `Project` concentra `Comment` e `Event`

### 9. Devem permitir cenarios de lista e detalhe

Para mocks de listagem:
- retornar colecao com pelo menos 2 itens quando o objetivo for demonstrar pagina ou filtro
- usar ids distintos
- variar `stage`, `priority`, `progress` e `role` para cobrir casos diferentes

Para mocks de detalhe:
- retornar objeto completo com os campos do schema e includes esperados

### 10. Devem representar os filtros dos query DTOs

Regra:
- mocks de consulta devem aceitar filtros parciais
- campos `undefined` nao entram no `where`
- se houver filtro por `id`, `username`, `orgkey`, `projectkey`, `ownerkey`, `date`, `role`, `stage` ou `priority`, o mock deve conseguir simular correspondencia exata

## Dataset base sugerido

```json
{
  "accounts": [
    {
      "id": "ckxacc01a0001",
      "email": "ana@tasker.dev",
      "password": "Senha@123"
    }
  ],
  "users": [
    {
      "id": "ckxusr01a0001",
      "username": "ana.silva",
      "name": "Ana Silva",
      "accountkey": "ckxacc01a0001"
    }
  ],
  "organizations": [
    {
      "id": "ckxorg01a0001",
      "name": "Tasker Studio",
      "ownerkey": "ana.silva"
    }
  ],
  "affiliations": [
    {
      "id": "ckxaff01a0001",
      "orgkey": "ckxorg01a0001",
      "userkey": "ana.silva",
      "role": "OWNER"
    }
  ],
  "projects": [
    {
      "id": "ckxpro01a0001",
      "title": "Portal de atendimento",
      "description": "Entrega da primeira versao do portal interno",
      "deadline": "2026-08-01T00:00:00.000Z",
      "stage": "IN_PROGRESS",
      "orgkey": "ckxorg01a0001",
      "managerkey": "ckxaff01a0001"
    }
  ],
  "members": [
    {
      "id": "ckxmem01a0001",
      "projectkey": "ckxpro01a0001",
      "userkey": "ckxaff01a0001"
    }
  ],
  "tasks": [
    {
      "id": "ckxtsk01a0001",
      "code": "TSK-A1B2C3",
      "name": "Validar login",
      "description": "Revisar fluxo de autenticacao e mensagens de erro",
      "due_date": "2026-07-20T00:00:00.000Z",
      "stage": "PENDING",
      "priority": "HIGH",
      "projectkey": "ckxpro01a0001",
      "ownerkey": "ckxmem01a0001"
    }
  ],
  "comments": [
    {
      "id": "ckxcom01a0001",
      "content": "Entrega aprovada para a primeira revisao.",
      "date": "2026-07-14T10:08:00.000Z",
      "ownerkey": "ana.silva",
      "projectkey": "ckxpro01a0001"
    }
  ],
  "events": [
    {
      "id": "ckxevt01a0001",
      "title": "Revisao de sprint",
      "date": "2026-07-18T14:00:00.000Z",
      "projectkey": "ckxpro01a0001",
      "category": "REVIEW"
    }
  ],
  "images": [
    {
      "id": "ckximg01a0001",
      "filename": "ana-avatar.png",
      "url": "https://cdn.tasker.dev/images/ana-avatar.png",
      "userkey": "ana.silva"
    }
  ],
  "notifications": [
    {
      "id": "ckxnot01a0001",
      "action": "User created a new project",
      "actorkey": "ana.silva"
    }
  ]
}
```

## Observacoes importantes para mockagem

- nao usar nomes de campos inventados
- nao substituir `username` por `id` nas relacoes que o schema resolve por `username`
- nao montar `Member` com `User.id`, porque o schema liga `Member.userkey` a `Affiliation.id`
- nao montar `Task.ownerkey` com `User.username`, porque o schema liga a `Member.id`
- nao assumir que todos os DTOs refletem perfeitamente o Prisma; onde houver divergencia, o mock deve seguir o contrato que o repository realmente persiste
- quando houver include, o mock deve carregar o nested data correspondente; quando nao houver, deve retornar o registro plano
