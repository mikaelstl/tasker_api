# Contexto do módulo Members

## Visão geral

`Member` é a participação de uma `Affiliation` em um projeto. Portanto, `Member.userkey` recebe o ID da afiliação, não `username` e não `Account.id`.

> Estado de registro: `MembersModule` está importado diretamente no `AppModule` e suas rotas ficam disponíveis na aplicação executada.

## Endpoints declarados

| Método | Rota | Permissão | Entrada | Status | `data` |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/members` | `MEMBERS:CREATE` | `DefineMemberDTO` | `201` | `MemberDTO` simples |
| `GET` | `/members/:projectkey` | `MEMBERS:SEEK` | ID do projeto | `200` | `MemberWithTasksDTO[]` |
| `DELETE` | `/members/remove/:id` | `MEMBERS:DEL` | ID de `Member` | `200` | `MemberDTO` simples |

Todas exigem Bearer JWT e `x-org-key`.

### Adicionar membro ao projeto

```json
{
  "project": "project-id",
  "user": "affiliation-id"
}
```

### Listar membros

O repository inclui `tasks` de cada membro. Há um defeito no controller: `@Param() projectkey` produz `{ projectkey: string }`, mas esse objeto é repassado como se fosse string. Deve ser corrigido para `@Param('projectkey') projectkey: string`.

## DTOs

```ts
interface DefineMemberDTO {
  project: string; // Project.id
  user: string;    // Affiliation.id
}

interface MemberDTO {
  id: string;
  projectkey: string;
  userkey: string; // Affiliation.id
  user: UserDTO;   // declaração incorreta: a relação real é Affiliation
  tasks: TaskDTO[];
  role: "OWNER" | "MEMBER"; // declaração sem campo correspondente no schema
}
```

Forma efetiva de um membro simples:

```ts
interface MemberRecordDTO {
  id: string;
  projectkey: string;
  userkey: string;
  created_at: string;
  updated_at: string;
}

interface MemberWithTasksDTO extends MemberRecordDTO {
  tasks: TaskDTO[];
}
```

`MemberRole` existe apenas no código TypeScript; o model Prisma `Member` não possui `role`. O papel organizacional está em `Affiliation.role`.

## Observações para o frontend

- Para permitir atribuição, o backend precisa fornecer o `Affiliation.id`; `GET /affiliations` hoje não o inclui.
- Para criar tarefa, use `Member.id` como responsável (`owner`), não username.
- Os DTOs são interfaces e não validam o body em runtime.
- O guard não encontra o projeto em `POST /members`, pois ele procura `body.id` e ignora `body.project`; a criação pode resultar em `403` mesmo para um papel permitido.
