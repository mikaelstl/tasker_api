# Contexto do módulo Projects

## Visão geral

Projeto pertence a uma organização (`Project.orgkey`), pode ter um gestor (`managerkey`, ID de `Affiliation`) e vários membros. Todas as rotas exigem JWT e `x-org-key`; as mutações de projeto exigem `OWNER`.

## Endpoints

| Método | Rota | Permissão | Entrada | Status | `data` |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/project` | `OWNER`, `PROJECTS:CREATE` | `CreateProjectDTO` | `201` | `ProjectDTO` |
| `GET` | `/project/list` | `OWNER`: todos da organização; `MANAGER`: gerenciados ou participados; `MEMBER`: participados | `ProjectQueryDTO` | `200` | `ProjectDTO[]` |
| `GET` | `/project/:id` | mesmas regras de visualização da listagem | ID do projeto | `200` | `ProjectWithMembersDTO` |
| `PUT` | `/project/:id` | `OWNER`, `PROJECTS:EDIT` | `EditProjectDTO` | `200` | `ProjectDTO` |
| `DELETE` | `/project/del/:id` | `OWNER`, `PROJECTS:DEL` | ID do projeto | `200` | `ProjectDTO` |

As quatro rotas de estatísticas ficam sob `/project/:id/stats` e estão detalhadas em `context/stats/contexto_modulo_stats.md`.

### Criar

Contrato declarado atualmente:

```json
{
  "title": "Novo dashboard",
  "description": "Descrição do projeto",
  "priority": "MEDIUM",
  "deadline": "2026-08-31T23:59:59.000Z"
}
```

O body HTTP não recebe uma chave de organização confiável. O controller injeta
`orgkey` a partir de `x-org-key` antes de chamar o serviço; qualquer `orgkey`
presente no body é sobrescrito.

### Listar

O controller preserva os filtros de `ProjectQueryDTO`, força o filtro `orgkey`
com a organização ativa e aplica o escopo da afiliação atual:

- `OWNER`: todos os projetos da organização;
- `MANAGER`: projetos em que `managerkey` é sua afiliação ou em que existe um
  registro de membro para sua afiliação;
- `MEMBER`: projetos em que existe um registro de membro para sua afiliação.

O cliente não precisa nem deve enviar filtros de afiliação para reproduzir
essas regras.

### Buscar

`GET /project/:id` exige que o projeto pertença à organização ativa e aplica as
mesmas relações da listagem. `MANAGER` ou `MEMBER` sem o vínculo necessário
recebe `403`. O retorno inclui `members`, mas cada membro vem sem relações
aninhadas.

## DTOs

```ts
type ProjectStage =
  | "STARTED"
  | "PENDING"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED";

interface CreateProjectDTO {
  title: string;
  description: string;
  orgkey: string; // interno; injetado pelo controller a partir do header
  priority?: ProjectPriority;
  deadline: string; // ISO 8601
}

interface EditProjectDTO {
  title?: string;
  description?: string;
  deadline?: string; // Date em runtime/ISO no JSON
  stage?: ProjectStage;
}

interface ProjectQueryDTO {
  id?: string;
  title?: string;
  description?: string;
  orgkey?: string;     // sempre sobrescrito pela organização ativa na listagem
  managerkey?: string; // ID de Affiliation
  deadline?: string;
  stage?: ProjectStage;
  delayed?: boolean;
}
```

O `ProjectDTO` declarado está desatualizado. Forma efetiva esperada pelo schema:

```ts
interface ProjectDTO {
  id: string;
  title: string;
  description: string;
  deadline: string;
  started_at: string | null;
  done_at: string | null;
  delayed: boolean;
  stage: ProjectStage;
  orgkey: string;
  managerkey: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectWithMembersDTO extends ProjectDTO {
  members: Array<{
    id: string;
    projectkey: string;
    userkey: string; // ID da Affiliation
    created_at: string;
    updated_at: string;
  }>;
}
```

Todos os DTOs de projeto são interfaces/types sem validação em runtime. O frontend deve validar campos obrigatórios antes do envio.

## Retorno e integração

As rotas usam `ApiResponse<T>`, com exceção do download PDF de estatísticas. Datas chegam como ISO 8601. Depois de criar/editar/excluir, atualize o cache da lista da organização ativa.

## Limitações atuais

- Na listagem não há projeto-alvo; o guard valida role/recurso e o serviço aplica
  o escopo de projetos correspondente à role.
- O DTO não expõe `isManager`, `isMember` ou capabilities; essas informações precisam ser derivadas de outros dados ou adicionadas pelo backend.
