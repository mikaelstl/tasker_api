# Contexto de permissionamento para o frontend

Este documento descreve como o frontend deve representar e aplicar o
permissionamento da Tasker API. Ele foi produzido a partir da implementação
atual do backend, principalmente de:

- `src/security/auth.guard.ts`;
- `src/guards/permission.guard.ts`;
- `src/permissions/permission.service.ts`;
- `src/authorization/access-control/access-control.bootstrap.ts`;
- `src/authorization/policies/*`;
- controllers e DTOs dos módulos protegidos;
- `prisma/schema.prisma`.

## 1. Resumo do modelo

A API combina dois modelos:

1. **RBAC por organização**: cada usuário possui uma role `OWNER`, `MANAGER`
   ou `MEMBER` em cada organização da qual participa.
2. **ABAC por recurso**: além da role, algumas operações exigem que o usuário
   tenha uma relação específica com o recurso, por exemplo ser gerente ou
   membro do projeto, dono da tarefa ou autor do comentário.

A role não está no JWT e não é global. O mesmo usuário pode ser `OWNER` em uma
organização e `MEMBER` em outra. Por isso, toda decisão de interface deve usar
a role da **organização atualmente selecionada**.

O backend continua sendo a autoridade final. Esconder ou desabilitar controles
no frontend melhora a experiência, mas não substitui a validação da API.

## 2. Dados de autenticação e seleção da organização

### Login

`POST /auth/login` retorna o envelope padrão, com os dados de autenticação em
`data`:

```ts
type AuthData = {
  account: string;
  email: string;
  username: string;
  access_token: string;
};
```

O JWT contém `sub`, `username` e `email`. Ele não contém role, organização ou
permissões.

### Organizações e roles do usuário

Após o login, o frontend deve chamar `GET /affiliations`. O endpoint retorna em
`data` a lista que deve alimentar o seletor de organizações:

```ts
type OrgRole = "OWNER" | "MANAGER" | "MEMBER";

type UserOrganizationSummary = {
  orgkey: string;
  role: OrgRole;
  name: string;
  projects: number;
  members: number;
};
```

Essa lista é a fonte atual da role do usuário no frontend. Não se deve deduzir
a role pelo JWT, pelo dono de um projeto ou por uma role salva de outra
organização.

### Headers obrigatórios

Nas rotas autenticadas, enviar:

```http
Authorization: Bearer <access_token>
```

Nas rotas que passam pelo `PermissionGuard`, enviar também:

```http
x-org-key: <orgkey-da-organizacao-selecionada>
```

Use exatamente o `orgkey` retornado por `GET /affiliations`. O header não deve
ser obtido de um campo editável da tela nem enviado a partir do corpo da
requisição.

Rotas autenticadas que atualmente não precisam de `x-org-key`:

- `GET /affiliations`;
- `GET /affiliations/participates/:orgkey`;
- `POST /org`;
- rotas que usam apenas `JwtAuthGuard`, fora do permissionamento organizacional.

## 3. Estado recomendado no frontend

O estado de sessão deve separar identidade, organização selecionada e contexto
do projeto:

```ts
type PermissionState = {
  auth: {
    token: string;
    account: string;
    username: string;
    email: string;
  } | null;

  organizations: UserOrganizationSummary[];

  activeOrganization: UserOrganizationSummary | null;

  activeProject: {
    id: string;
    // Campos abaixo são necessários para decisões ABAC.
    managerAffiliationId?: string | null;
    currentUserAffiliationId?: string;
    currentUserMemberId?: string | null;
    isManager: boolean;
    isMember: boolean;
    belongsToActiveOrganization: boolean;
  } | null;
};
```

Ao trocar de organização, o frontend deve:

1. atualizar `activeOrganization`;
2. limpar projeto, membros, tarefas, comentários, eventos e estatísticas em
   cache da organização anterior;
3. invalidar consultas cuja chave não inclua `orgkey`;
4. passar a enviar o novo `x-org-key`;
5. redirecionar para uma rota válida dentro da nova organização.

Não reutilize uma resposta carregada com outra organização, mesmo quando o ID
do recurso ainda estiver presente na URL.

## 4. Regra central de autorização no frontend

Evite condicionais de role espalhadas pelos componentes. Centralize as regras
em uma função ou hook, por exemplo:

```ts
type Action = "CREATE" | "DEL" | "EDIT" | "SEEK" | "PROMOTE" | "DEMOTE";
type Resource =
  | "ORGS"
  | "AFFILIATIONS"
  | "PROJECTS"
  | "MEMBERS"
  | "TASKS"
  | "COMMENTS"
  | "EVENTS"
  | "PROJECT_STATS";

type PermissionInput = {
  role: OrgRole;
  resource: Resource;
  action: Action;
  project?: {
    isManager: boolean;
    isMember: boolean;
    belongsToActiveOrganization: boolean;
  };
  task?: {
    ownerMemberId: string;
  };
  comment?: {
    ownerUsername: string;
  };
  currentUser: {
    username: string;
    memberId?: string | null;
  };
};
```

Além de `can(...)`, vale expor componentes como `Can` e guards de rota. Todos
devem consumir a mesma função para que menu, botão, atalho de teclado e rota
tenham o mesmo comportamento.

Uma implementação inicial, espelhando as chaves registradas hoje, pode seguir
esta lógica:

```ts
function can(input: PermissionInput): boolean {
  const { role, resource, action, project, task, comment, currentUser } = input;
  const isProjectManager = project?.isManager === true;
  const isProjectMember = project?.isMember === true;
  const isProjectInActiveOrganization =
    project?.belongsToActiveOrganization === true;
  const isTaskOwner =
    !!currentUser.memberId && task?.ownerMemberId === currentUser.memberId;
  const isCommentOwner = comment?.ownerUsername === currentUser.username;

  if (role === "OWNER") {
    if (resource === "ORGS") {
      return ["CREATE", "SEEK", "EDIT", "DEL"].includes(action);
    }
    if (resource === "AFFILIATIONS") {
      return ["CREATE", "SEEK", "EDIT", "DEL", "PROMOTE", "DEMOTE"]
        .includes(action);
    }
    if (resource === "PROJECTS") {
      return action === "CREATE" || isProjectInActiveOrganization;
    }
    if (resource === "COMMENTS") {
      return isProjectInActiveOrganization
        && ["CREATE", "EDIT", "DEL"].includes(action);
    }
    if (resource === "EVENTS") {
      return isProjectInActiveOrganization && action === "SEEK";
    }
    if (resource === "PROJECT_STATS") {
      return isProjectInActiveOrganization
        && ["SEEK", "CREATE"].includes(action);
    }
    return isProjectInActiveOrganization
      && ["MEMBERS", "TASKS"].includes(resource)
      && ["CREATE", "SEEK", "EDIT", "DEL"].includes(action);
  }

  if (role === "MANAGER") {
    if (["ORGS", "AFFILIATIONS"].includes(resource)) {
      return action === "SEEK";
    }
    if (resource === "PROJECTS") {
      return action === "SEEK" && (isProjectManager || isProjectMember);
    }
    if (resource === "PROJECT_STATS") {
      return isProjectManager && ["SEEK", "CREATE"].includes(action);
    }
    return isProjectManager
      && ["MEMBERS", "TASKS", "COMMENTS", "EVENTS"].includes(resource)
      && ["CREATE", "SEEK", "EDIT", "DEL"].includes(action);
  }

  if (["ORGS", "AFFILIATIONS"].includes(resource)) {
    return action === "SEEK";
  }
  if (["PROJECTS", "MEMBERS", "EVENTS"].includes(resource)) {
    return action === "SEEK" && isProjectMember;
  }
  if (resource === "TASKS") {
    if (["CREATE", "SEEK"].includes(action)) return isProjectMember;
    return ["EDIT", "DEL"].includes(action) && isTaskOwner;
  }
  if (resource === "COMMENTS") {
    if (["CREATE", "SEEK"].includes(action)) return isProjectMember;
    return ["EDIT", "DEL"].includes(action) && isCommentOwner;
  }
  return false;
}
```

Essa função controla somente as combinações protegidas pelo sistema de
permissões. `POST /org`, por exemplo, exige autenticação, mas não passa hoje
pelo `PermissionGuard`, permitindo que qualquer usuário autenticado crie sua
própria organização. Também não se deve renderizar uma ação apenas porque ela
aparece na função: o endpoint correspondente precisa existir.

## 5. Matriz funcional de permissões

A matriz abaixo representa o desenho registrado no controle de acesso. As
condições da última coluna são indispensáveis: a role sozinha não concede
acesso irrestrito a todos os projetos da organização.

| Role | Recurso | Ações registradas | Condição adicional |
| --- | --- | --- | --- |
| `OWNER` | Organização | criar, consultar, editar, excluir | ser dono da organização selecionada |
| `OWNER` | Afiliações | criar, consultar, editar, excluir, promover, rebaixar | ser dono da organização selecionada |
| `OWNER` | Projetos | criar, consultar, editar, excluir | ser dono da organização; em um projeto existente, ele deve pertencer à organização selecionada |
| `OWNER` | Membros | criar, consultar, editar, excluir | projeto pertencente à organização selecionada |
| `OWNER` | Tarefas | criar, consultar, editar, excluir | projeto pertencente à organização selecionada |
| `OWNER` | Comentários | criar, editar, excluir | projeto pertencente à organização selecionada |
| `OWNER` | Eventos | consultar | projeto pertencente à organização selecionada |
| `OWNER` | Estatísticas | consultar e gerar relatório | projeto pertencente à organização selecionada |
| `MANAGER` | Organização e afiliações | consultar | participar da organização |
| `MANAGER` | Projetos | consultar | ser gerente ou membro do projeto |
| `MANAGER` | Membros, tarefas, comentários e eventos | criar, consultar, editar, excluir | ser gerente do projeto alvo |
| `MANAGER` | Estatísticas | consultar e gerar relatório | ser gerente do projeto alvo |
| `MEMBER` | Organização e afiliações | consultar | participar da organização selecionada |
| `MEMBER` | Projetos, membros e eventos | consultar | ser membro do projeto alvo |
| `MEMBER` | Tarefas | criar e consultar | ser membro do projeto alvo |
| `MEMBER` | Tarefas | editar e excluir | ser dono da tarefa |
| `MEMBER` | Comentários | criar e consultar | ser membro do projeto alvo |
| `MEMBER` | Comentários | editar e excluir | ser autor do comentário |

Observações importantes sobre a matriz atual:

- `MANAGER` não pode criar, editar ou excluir projetos.
- `MEMBER` não pode alterar membros ou eventos.
- estatísticas e relatórios são exclusivos de `OWNER` e `MANAGER`.
- não existe hierarquia implícita no frontend. Cada combinação está
  explicitamente registrada no backend.
- atualmente não há uma operação de edição de comentário no controller, embora
  a chave de permissão exista.
- para `OWNER`, não há chaves registradas para consultar comentários nem para
  criar, editar ou excluir eventos. Isso aparenta ser uma lacuna do backend e
  não deve ser inventado pelo frontend.

## 6. Regras de interface por contexto

### Organização

- O seletor mostra somente organizações retornadas por `GET /affiliations`.
- A administração de afiliações só aparece para `OWNER`.
- Promoção, rebaixamento e remoção devem usar o ID da afiliação, não o username.
- O frontend não deve permitir promover quem já é `OWNER` nem rebaixar um
  `MEMBER`. Também não deve oferecer rebaixamento do `OWNER` enquanto a regra de
  transferência de propriedade não estiver definida.

### Projeto

- `OWNER` pode criar projeto na organização ativa.
- `MANAGER` só administra recursos dos projetos para os quais foi designado.
- `MEMBER` só acessa projetos em que possui um registro de membro.
- As telas de estatísticas e geração de PDF aparecem somente para `OWNER` ou
  para o gerente do projeto.

### Tarefa

O campo `Task.ownerkey` referencia `Member.id`, não `User.username`. Portanto,
para saber se um `MEMBER` pode editar ou excluir uma tarefa, compare:

```ts
task.ownerkey === activeProject.currentUserMemberId
```

Não compare `task.ownerkey` com `auth.username`.

`OWNER` e o gerente do projeto não dependem da autoria da tarefa; dependem da
relação com o projeto.

### Comentário

O campo `Comment.ownerkey` referencia `User.username`. Para um `MEMBER`, compare:

```ts
comment.ownerkey === auth.username
```

`OWNER` e o gerente do projeto dependem da relação com o projeto, não da autoria
do comentário.

### Evento

`MEMBER` possui acesso somente de leitura. `MANAGER` possui CRUD se gerenciar o
projeto. A configuração atual só registra leitura para `OWNER`; até o backend
ser corrigido, o frontend deve tratar mutações de evento por `OWNER` como não
suportadas, ou aceitar que receberá `403`.

## 7. Interceptor HTTP

Uma implementação conceitual para o cliente HTTP é:

```ts
function buildHeaders(url: string, token?: string, orgkey?: string) {
  const headers: Record<string, string> = {};

  if (token) headers.Authorization = `Bearer ${token}`;

  const doesNotUseOrganization =
    url === "/affiliations" ||
    url.startsWith("/affiliations/participates/") ||
    url === "/org";

  if (orgkey && !doesNotUseOrganization) {
    headers["x-org-key"] = orgkey;
  }

  return headers;
}
```

É aceitável enviar `x-org-key` também em endpoints autenticados que o ignoram,
mas ele nunca deve ser enviado com um valor antigo após a troca de organização.

Para downloads em `POST /project/:id/stats/report`, usar resposta binária
(`blob`/`arrayBuffer`). Essa rota ainda exige os dois headers.

## 8. Tratamento de respostas e erros

Todos os sucessos JSON usam:

```ts
type ApiResponse<T> = {
  status: number;
  data: T;
  message: string;
  timestamp: string;
  path: string;
};
```

Erros globais usam:

```ts
type ApiError = {
  status: number;
  errors: Array<{
    level: "error" | "warning" | string;
    message: string;
    error?: string;
  }>;
  timestamp: string;
  path: string;
};
```

Comportamento recomendado:

- `401`: token ausente/inválido ou `x-org-key` ausente. Se o token estiver
  presente, não encerre a sessão automaticamente antes de distinguir o caso de
  organização não selecionada. Se possível, redirecione para o seletor.
- `403`: sessão válida, mas a operação foi negada. Mantenha o usuário logado,
  reverta atualizações otimistas e mostre a mensagem retornada.
- `400`: dados inválidos ou falha de vínculo. Mostre `errors[].message` junto ao
  formulário ou à ação correspondente.
- após promover, rebaixar, adicionar ou remover uma afiliação, recarregue
  `GET /affiliations` e invalide permissões derivadas.

O adaptador HTTP pode tratar `ApiResponse<T>` como o único formato de sucesso
JSON. A geração de relatório é a exceção: retorna PDF binário e deve continuar
sendo consumida como `blob`/`arrayBuffer`.

## 9. Limitações atuais que afetam o frontend

Há inconsistências no backend que impedem o frontend de reproduzir com precisão
todas as decisões do guard.

### 9.1 Contexto insuficiente nas respostas

`GET /affiliations` retorna a role e o `orgkey`, mas não retorna o ID da própria
afiliação. O frontend precisa desse ID para comparar gerente e membro de projeto.
Além disso, os projetos listados não expõem de forma estável os indicadores
`isManager` e `isMember` do usuário atual.

Recomendação de contrato para o backend:

```ts
type CurrentPermissionContext = {
  orgkey: string;
  role: OrgRole;
  affiliationId: string;
  projects: Record<string, {
    isManager: boolean;
    isMember: boolean;
    memberId: string | null;
  }>;
};
```

Uma alternativa melhor é cada resposta de projeto trazer `capabilities`, por
exemplo `canEdit`, `canDelete`, `canManageMembers` e `canViewStats`. Isso mantém
a regra no backend e reduz duplicação no frontend.

### 9.2 O guard extrai apenas um alvo genérico

O `PermissionGuard` calcula `targetkey` nesta ordem:

```ts
body.id ?? params.id ?? params.projectkey ?? params.code
```

Ele não lê `body.project`, `body.projectkey` nem queries. Como consequência,
operações como criar tarefa/comentário/evento/membro e listar comentários ou
eventos chegam às policies sem o ID do projeto. Outras operações enviam ID de
membro, tarefa, comentário ou evento para uma policy que espera ID de projeto.

Impacto: diversos botões permitidos pela matriz ainda podem receber `403`. Isso
não é corrigível apenas no frontend sem alterar artificialmente o payload. O
frontend não deve enviar campos extras que não façam parte do contrato para
tentar contornar o guard.

### 9.3 Policy de autoria de tarefa compara chaves incompatíveis

O banco armazena `Task.ownerkey = Member.id`, mas `TasksOwnershipPolicy` envia o
username para uma consulta que compara esse valor diretamente com `ownerkey`.
Assim, a edição/exclusão de tarefa pelo membro autor tende a ser negada mesmo
quando a comparação correta no frontend indica autoria.

### 9.4 Escopo cruzado em organização e afiliação

Algumas policies validam que o solicitante é dono da organização do header, mas
não confirmam que o ID alterado pertence à mesma organização. Isso ocorre, por
exemplo, ao excluir organização ou manipular uma afiliação por ID. O frontend
deve sempre usar IDs provenientes da organização ativa, porém isso é apenas uma
proteção de UX; o backend precisa validar a relação para evitar acesso cruzado.

### 9.5 Rotas e chaves incompletas

- `GET /tasks/:projectkey/:code` declara um código, mas a busca atual compara
  esse valor com `Task.id`.
- eventos usam `:code`, embora o modelo `Event` possua `id` e não possua `code`.
- `OWNER` não tem todas as chaves esperadas para comentários e eventos.
- `GET /project/list` não possui `targetkey`: o guard valida a combinação de
  role/recurso e o serviço limita o resultado conforme a role e a afiliação.
- membros removidos são autorizados usando o ID do membro como se fosse ID de
  projeto.

Até esses pontos serem corrigidos, trate o `403` como fonte final da verdade e
não faça atualização otimista destrutiva.

### 9.6 Migração de `ownerkey` para `orgkey` em projetos

Projetos usam `Project.orgkey`. Para o frontend, a organização é indicada pelo
header `x-org-key`; não envie `ownerkey` nem permita que o usuário escolha uma
organização diferente no body. Na criação e listagem, o backend injeta ou força
o `orgkey` da organização ativa.

### 9.7 Recursos ainda fora desse modelo

- o controller de audit log está vazio e ainda não expõe uma API consumível;
- upload exige JWT, mas não usa o `PermissionGuard` organizacional;
- contas e usuários usam autenticação própria ou não têm autorização por
  organização.

Não crie entradas na matriz organizacional para esses recursos até que o
backend defina o respectivo contrato.

## 10. Fluxo recomendado de inicialização

```text
login
  -> salvar token e identidade
  -> GET /affiliations
  -> escolher/restaurar uma organização ainda presente na resposta
  -> configurar x-org-key
  -> carregar projetos permitidos
  -> ao entrar em um projeto, carregar o vínculo do usuário
  -> calcular capabilities
  -> renderizar rotas e ações
```

Se a organização salva anteriormente não estiver mais na lista, descarte-a. Se
a role mudar, substitua imediatamente o estado anterior e recalcule toda a UI.

## 11. Checklist de implementação

- [ ] Persistir token e identidade sem persistir permissões indefinidamente.
- [ ] Carregar roles por `GET /affiliations` após login e ao retomar sessão.
- [ ] Manter uma única organização ativa.
- [ ] Incluir `orgkey` em todas as chaves de cache organizacional.
- [ ] Injetar `Authorization` e `x-org-key` no cliente HTTP.
- [ ] Centralizar `can(resource, action, context)`.
- [ ] Proteger páginas e também ações dentro das páginas.
- [ ] Comparar tarefa com `Member.id` e comentário com `username`.
- [ ] Restringir estatísticas a owner/gerente do projeto.
- [ ] Revalidar afiliações e permissions após mudanças de role.
- [ ] Tratar `401`, `403` e `400` separadamente.
- [ ] Considerar a API como autoridade final e sempre tratar negação no submit.
- [ ] Não contornar falhas de autorização enviando IDs extras no payload.
