# Contexto do módulo Tasks

## Visão geral

Uma tarefa pertence a um projeto e seu responsável é um `Member`. `ownerkey` e o campo `owner` do body devem conter `Member.id`.

## Endpoints

| Método | Rota | Permissão | Entrada | Status | Retorno |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/tasks` | `TASKS:CREATE` | `TaskCreateDTO` | `201` | `ApiResponse<TaskDTO>` |
| `GET` | `/tasks/:projectkey` | `TASKS:SEEK` | projeto + `TaskQueryDTO` | `200` | `ApiResponse<TaskWithOwnerDTO[]>` |
| `GET` | `/tasks/:projectkey/:code` | `TASKS:SEEK` | projeto + código | `200` | `ApiResponse<TaskWithOwnerDTO>` |
| `PUT` | `/tasks/:projectkey/:code` | `TASKS:EDIT` | projeto + atualização sem DTO | `200` | `ApiResponse<TaskDTO>` |
| `DELETE` | `/tasks/del/:id` | `TASKS:DEL` | `Task.id` | `200` | `ApiResponse<TaskDTO>` |

Todas exigem Bearer JWT e `x-org-key`.

### Criar

```json
{
  "name": "Implementar login",
  "description": "Criar formulário e integração",
  "project": "project-id",
  "owner": "member-id",
  "priority": "HIGH",
  "deadline": "2026-08-01T18:00:00.000Z"
}
```

O código público `TSK-XXXXXX` é gerado pelo servidor.

### Atualizar

Não há `EditTaskDTO`. O repository lê apenas `name`, `description`, `priority`, `stage` e `deadline`; demais campos não devem ser enviados.

```ts
interface EditTaskDTODeFato {
  name?: string;
  description?: string;
  priority?: TaskPriority;
  stage?: TaskStage;
  deadline?: string;
}
```

## DTOs

```ts
type TaskStage = "STARTED" | "PENDING" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

interface TaskCreateDTO {
  name: string;
  description: string;
  project: string; // Project.id
  owner: string;   // Member.id
  priority: TaskPriority;
  deadline: string;
}

interface TaskQueryDTO {
  code?: string;
  name?: string;
  projectkey?: string;
  ownerkey?: string;
  stage?: TaskStage;
  priority?: TaskPriority;
  deadline?: string;
  delayed?: boolean;
}

interface TaskDTO {
  id: string;
  code: string;
  name: string;
  description: string;
  projectkey: string;
  ownerkey: string;
  stage: TaskStage;
  priority: TaskPriority;
  deadline: string;
  started_at: string | null;
  done_at: string | null;
  delayed: boolean;
  created_at: string;
  updated_at: string;
}

interface TaskWithOwnerDTO extends TaskDTO {
  owner: MemberRecordDTO;
}
```

Os DTOs são interfaces e não impõem validação em runtime.

## Problemas de roteamento e autorização

- `GET /tasks/:projectkey/:code` recebe um código, mas `repository.find()` busca
  o segundo argumento no campo `id`. A rota e a consulta ainda precisam adotar
  o mesmo identificador.
- No `POST`, o guard ignora `body.project`, então o projeto-alvo fica indefinido.
- Em `PUT`, o guard trata `:code` como se fosse a chave exigida pelas políticas, mas ownership no repository procura por `Task.id`.
- Ownership de membro está inconsistente: a política fornece username, enquanto `Task.ownerkey` armazena `Member.id`.
- Listagem e busca incluem o objeto `owner`; criação, edição e exclusão não incluem.
