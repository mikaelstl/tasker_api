# Contexto de transferência de propriedade e entidades órfãs

## Objetivo

Este contexto define a forma mais simples de implementar:

- bloqueio da exclusão de usuário que ainda possua organizações;
- transferência do proprietário de uma organização;
- preservação de projetos, tarefas e comentários após a exclusão de uma conta;
- identificação e correção de projetos e tarefas sem responsável;
- edição do gestor de um projeto.

A proposta reaproveita as relações atuais e representa uma entidade órfã pela ausência da respectiva chave estrangeira. Não é necessário criar tabela de histórico, usuário artificial, flag `orphaned` ou novo papel.

## Definições

- **Projeto órfão**: projeto cujo `managerkey` é `null`. O projeto continua pertencendo à organização por `orgkey`.
- **Tarefa órfã**: tarefa cujo `ownerkey` é `null`. A tarefa continua pertencendo
  ao projeto por `projectkey`.
- **Comentário órfão**: comentário cujo `ownerkey` é `null`. O conteúdo e o vínculo com o projeto são preservados.
- **Proprietário da organização**: deve existir simultaneamente em
  `Organization.ownerkey` e em uma `Affiliation` da mesma organização com
  `role = OWNER`.

Para comentários sem autor, a nomenclatura padrão no frontend será **"Usuário removido"**. Ela preserva o sentido histórico melhor que "Anônimo", pois o comentário foi originalmente criado por uma conta autenticada.

## Regras invariantes

1. Uma organização possui exatamente um proprietário.
2. `Organization.ownerkey` deve ser igual ao `userkey` da única afiliação
   `OWNER` daquela organização.
3. Não se cria uma afiliação diretamente com papel `OWNER`. Novas afiliações aceitam apenas `MEMBER` ou `MANAGER`; `OWNER` só é obtido por transferência.
4. Uma afiliação `OWNER` não pode ser removida nem rebaixada. Primeiro deve ocorrer a transferência.
5. Uma conta não pode ser excluída enquanto seu usuário constar como `ownerkey` de uma ou mais organizações.
6. A transferência altera as afiliações existentes; não exclui nem recria afiliação ou membro de projeto.
7. O novo proprietário mantém seus vínculos atuais com projetos e tarefas.
8. O proprietário anterior recebe obrigatoriamente `role = MEMBER`, mesmo que anteriormente também atuasse como gestor.
9. Excluir uma conta sem organizações próprias preserva projetos gerenciados, tarefas atribuídas e comentários, tornando suas referências ao usuário nulas.
10. Um novo gestor de projeto deve ser uma afiliação `MANAGER` da mesma organização do projeto.
11. Um novo responsável de tarefa deve ser um `Member` do mesmo projeto da tarefa.

## Estado atual encontrado

| Área | Estado atual | Ajuste necessário |
| --- | --- | --- |
| Exclusão de conta | Captura qualquer `P2003` e retorna conflito genérico | Bloquear explicitamente somente organizações próprias e permitir orfandade das demais relações |
| Proprietário | `Organization.ownerkey` e `Affiliation.role` são atualizados separadamente | Atualizar os dois lados na mesma transação |
| Promoção | `MANAGER -> OWNER` altera apenas a role | Retirar `OWNER` do fluxo comum de promoção |
| Criação de afiliação | O body pode informar `OWNER` | Aceitar apenas `MEMBER` ou `MANAGER` |
| Gestor do projeto | `managerkey` já é opcional e a FK usa `SET NULL` | Aceitar e validar `managerkey` na edição |
| Responsável da tarefa | `Task.ownerkey` é obrigatório | Torná-lo opcional e usar `SET NULL` |
| Autor do comentário | `Comment.ownerkey` é obrigatório | Torná-lo opcional e usar `SET NULL` |
| Edição da tarefa | O update ignora responsável | Adicionar `ownerkey` ao DTO e ao update validado |
| Frontend | Os tipos assumem responsáveis sempre presentes | Aceitar `null`, exibir alertas e oferecer seletores |

## Alterações mínimas no schema Prisma

As relações com a organização e o projeto continuam obrigatórias. Somente as relações que representam a pessoa responsável passam a aceitar `null`.

```prisma
model Organization {
  ownerkey String
  owner    User @relation(
    "OrgOwner",
    fields: [ownerkey],
    references: [username],
    onDelete: Restrict
  )
}

model Affiliation {
  userkey String
  user    User @relation(
    fields: [userkey],
    references: [username],
    onDelete: Cascade
  )
}

model Project {
  managerkey String?
  manager    Affiliation? @relation(
    fields: [managerkey],
    references: [id],
    onDelete: SetNull
  )
}

model Task {
  ownerkey String?
  owner    Member? @relation(
    fields: [ownerkey],
    references: [id],
    onDelete: SetNull
  )
}

model Comment {
  ownerkey String?
  owner    User? @relation(
    fields: [ownerkey],
    references: [username],
    onDelete: SetNull
  )
}
```

Para que a exclusão da conta não continue falhando por relações secundárias:

```prisma
model Image {
  user User @relation(
    fields: [userkey],
    references: [username],
    onDelete: Cascade
  )
}

model Notification {
  actorkey String?
  actor    User? @relation(
    fields: [actorkey],
    references: [username],
    onDelete: SetNull
  )
}
```

`AuditLog.actor` já é opcional e usa `onDelete: SetNull`; deve permanecer assim.
`Member.user` já usa `onDelete: Cascade`. Ao excluir a afiliação, seus registros `Member` são removidos e as tarefas passam a `ownerkey = null`.

Essa solução mínima mantém tarefas, projetos e comentários, mas os registros de horas e entradas estatísticas atualmente ligados ao `Member` continuam seguindo seus `onDelete: Cascade`. Preservar também esse histórico seria uma regra adicional e exigiria tornar `memberkey` opcional em `TaskWorkLog` e `ProjectStatsPeriodTask`; não faz parte deste escopo.

## Migração

A migração deve:

1. remover as FKs atuais de tarefa, comentário, afiliação, imagem e notificação;
2. tornar `tasks.ownerkey`, `comments.ownerkey` e `notifications.actorkey`
   opcionais;
3. recriar as FKs com `SET NULL`, `CASCADE` ou `RESTRICT`, conforme o schema;
4. preservar todos os dados existentes;
5. executar `prisma generate` após aplicar a migração.

Não é necessária coluna `is_orphan`. A condição é derivada diretamente:

```ts
const isOrphanProject = project.managerkey === null;
const isOrphanTask = task.ownerkey === null;
const isRemovedCommentAuthor = comment.ownerkey === null;
```

## Exclusão de conta

### Regra no backend

Em `AccountRepository.deleteIdentity`, antes de excluir a conta, consultar o usuário e contar suas organizações dentro da mesma transação:

```ts
const account = await transaction.account.findUnique({
  where: { id: accountId },
  include: {
    user: {
      include: {
        _count: { select: { organizations: true } },
      },
    },
  },
});

if (account.user._count.organizations > 0) {
  throw new ConflictException(
    "Usuário possui organizações",
  );
}

await transaction.account.delete({ where: { id: accountId } });
```

O bloqueio por organização deve ser explícito; não deve depender da captura genérica de `P2003`. A FK `Organization.owner -> User` com `RESTRICT` permanece como segunda barreira de integridade.

Depois que o usuário não possuir organizações:

- `Account -> User`: remove o perfil por `CASCADE`;
- `User -> Affiliation`: remove as afiliações por `CASCADE`;
- `Affiliation -> Project.manager`: define `managerkey = null`;
- `Affiliation -> Member`: remove os vínculos de participação por `CASCADE`;
- `Member -> Task.owner`: define `ownerkey = null`;
- `User -> Comment.owner`: define `ownerkey = null`;
- `User -> AuditLog.actor` e `Notification.actor`: define a referência como
  `null`;
- `User -> Image`: remove a imagem por `CASCADE`.

### Contrato HTTP

O endpoint existente é mantido:

```http
DELETE /accounts/me
Authorization: Bearer <token>
```

Quando houver organizações próprias:

```json
{
  "status": 409,
  "errors": [
    {
      "message": "Usuário possui organizações"
    }
  ]
}
```

Quando não houver, mantém `200` com `data: null`.

### Tratamento do conflito no frontend

Na tela `src/screens/Profile/index.tsx`, os fluxos `deleteUser` e
`deleteAccount` devem verificar o erro antes de chamar o `notifyError`
genérico. Quando a API responder `409` e alguma entrada de `errors` possuir
`message === "Usuário possui organizações"`, abrir um modal com:

- título: **Não foi possível remover sua conta**;
- mensagem: **Você possui organizações ativas, transfira a liderança para outro membro antes de remover sua conta**;
- uma ação **Entendi** ou **Fechar**, que apenas fecha o modal.

Nesse caso, o frontend não deve encerrar a sessão, navegar para `/login` nem
exibir simultaneamente o toast genérico. O estado `deleting` deve voltar para
`null` pelo `finally`, mantendo a tela de perfil disponível para o usuário
realizar a transferência.

Para manter a alteração pequena, pode ser criado um estado booleano na própria
tela:

```ts
const [ownershipConflictOpen, setOwnershipConflictOpen] = useState(false);

function isOrganizationOwnershipConflict(error: unknown) {
  const apiError = error as ApiError;

  return apiError.status === 409 &&
    apiError.errors?.some(
      ({ message }) => message === "Usuário possui organizações",
    );
}
```

O `catch` dos dois métodos de exclusão segue o mesmo padrão:

```ts
if (isOrganizationOwnershipConflict(error)) {
  setOwnershipConflictOpen(true);
  return;
}

notifyError(error, fallback, notifications);
```

O modal pode seguir a mesma estrutura visual e de acessibilidade já usada em
`components/popups/InviteMember` (`Overlay`, `role="dialog"`,
`aria-modal="true"` e fechamento por botão, clique externo ou tecla Escape).
Ele pode ficar inicialmente na própria tela `Profile`, ou ser extraído para
`components/popups` caso venha a ser reutilizado. Não é necessário alterar o
serviço HTTP para esse tratamento.

## Transferência do proprietário

### Endpoint

Adicionar um endpoint explícito evita misturar promoção comum com transferência de liderança:

```http
PATCH /affiliations/:id/ownership/transfer
Authorization: Bearer <token>
x-org-key: <org-id>
```

- somente o `OWNER` atual pode executar;
- `:id` é o ID da afiliação que receberá a propriedade;
- a afiliação alvo deve pertencer ao `x-org-key`;
- a operação pode receber alvo `MEMBER` ou `MANAGER`;
- tentar transferir para uma afiliação de outra organização retorna `404` ou
  `403`, sem revelar dados externos;
- transferir para o proprietário atual pode ser tratado como operação
  idempotente e retornar `200`.

O retorno pode reutilizar `AffiliationDTO` do novo proprietário. Após sucesso, o
frontend deve recarregar a organização ativa e suas afiliações.

### Transação

Criar um método de repository dedicado, por exemplo
`transferOwnership(orgkey, targetAffiliationId)`, com uma única
`prisma.$transaction`:

1. buscar a organização pelo `orgkey`;
2. buscar a afiliação alvo por `{ id, orgkey }`;
3. buscar a afiliação do proprietário atual por
   `{ userkey: organization.ownerkey, orgkey }`;
4. validar que os três registros existem;
5. atualizar a afiliação anterior para `MEMBER`;
6. atualizar a afiliação alvo para `OWNER`;
7. atualizar `Organization.ownerkey` para `target.userkey`;
8. confirmar a transação.

Exemplo conceitual:

```ts
await prisma.$transaction(async (tx) => {
  const organization = await tx.organization.findUnique({
    where: { id: orgkey },
  });

  const target = await tx.affiliation.findFirst({
    where: { id: targetAffiliationId, orgkey },
  });

  const previousOwner = await tx.affiliation.findUnique({
    where: {
      userkey_orgkey: {
        userkey: organization.ownerkey,
        orgkey,
      },
    },
  });

  await tx.affiliation.update({
    where: { id: previousOwner.id },
    data: { role: "MEMBER" },
  });

  await tx.affiliation.update({
    where: { id: target.id },
    data: { role: "OWNER" },
  });

  await tx.organization.update({
    where: { id: orgkey },
    data: { ownerkey: target.userkey },
  });
});
```

As afiliações são atualizadas no lugar. Como seus IDs não mudam:

- o novo proprietário continua como gestor dos projetos que já gerenciava;
- seus registros `Member` continuam nos mesmos projetos;
- suas tarefas continuam apontando para os mesmos registros `Member`;
- o proprietário anterior também mantém participações e tarefas, mudando apenas para `MEMBER` na organização.

O fluxo comum de `promote` deve ficar limitado a `MEMBER -> MANAGER`. A transferência passa a ser a única operação capaz de produzir `OWNER`. `demote` continua limitado a `MANAGER -> MEMBER`.

Também devem ser rejeitados:

- `POST /affiliations` com `role = OWNER`;
- remoção de uma afiliação `OWNER`;
- rebaixamento direto de uma afiliação `OWNER`.

## Edição do gestor do projeto

O endpoint atual pode ser reutilizado:

```http
PUT /project/:id
Authorization: Bearer <token>
x-org-key: <org-id>
Content-Type: application/json
```

Adicionar ao DTO:

```ts
interface EditProjectDTO {
  title?: string;
  description?: string;
  deadline?: string;
  stage?: ProjectStage;
  priority?: ProjectPriority;
  managerkey?: string | null; // Affiliation.id
}
```

Antes do update:

1. confirmar que o projeto pertence ao `x-org-key`;
2. quando `managerkey` não for `null`, buscar a afiliação por
   `{ id: managerkey, orgkey: project.orgkey, role: MANAGER }`;
3. rejeitar afiliação de outra organização ou com outro papel;
4. incluir `managerkey` no `data` do `prisma.project.update`;
5. registrar `managerkey` no audit log.

Somente o proprietário da organização edita o gestor. `null` pode ser aceito para remover explicitamente o gestor, deixando o projeto órfão.

## Edição do responsável da tarefa

Criar um `EditTaskDTO` real e substituir o `unknown/any` do fluxo atual:

```ts
interface EditTaskDTO {
  name?: string;
  description?: string;
  priority?: TaskPriority;
  stage?: TaskStage;
  deadline?: string;
  ownerkey?: string | null; // Member.id
}
```

Quando `ownerkey` for informado:

1. buscar o `Member` pelo ID;
2. confirmar `member.projectkey === task.projectkey`;
3. permitir a troca apenas ao proprietário da organização ou ao gestor do
   projeto;
4. atualizar `Task.ownerkey`;
5. incluir a mudança no audit log.

O membro responsável continua podendo editar os demais campos da própria tarefa, mas não pode transferi-la. Essa validação precisa ser feita no serviço, pois se trata de permissão por campo.

O endpoint atual é mantido:

```http
PUT /tasks/:projectkey/:code
```

## Retornos nullable

Atualizar os DTOs de backend e frontend:

```ts
interface ProjectDTO {
  managerkey: string | null;
}

interface TaskDTO {
  ownerkey: string | null;
}

interface TaskWithOwnerDTO extends TaskDTO {
  owner: MemberRecordDTO | null;
}

interface CommentDTO {
  ownerkey: string | null;
}
```

As consultas de tarefas devem continuar usando `include: { owner: true }`.
Quando a tarefa for órfã, o Prisma retornará `owner: null`.

## Ajustes visuais no frontend

### Projetos

Nos cards/lista de projetos, o `OWNER` visualiza uma tag quando `project.managerkey === null`:

```tsx
{isOwner && project.managerkey === null
  ? <Badge>Projeto sem gestor</Badge>
  : null}
```

Na tela existente `screens/Project/Edit`:

- carregar `AffiliationService.listByOrganization(orgkey)`;
- filtrar `role === MANAGER`;
- exibir um seletor de gestor;
- iniciar o seletor com `project.managerkey`;
- enviar `managerkey` no `ProjectService.update`.

Não é necessário um endpoint novo para listar candidatos; a listagem de afiliações já retorna `id`, `orgkey`, `role` e `user`.

### Tarefas

Nos cards e no detalhe:

```tsx
const orphan = task.ownerkey === null;
```

- mostrar a tag **"Sem responsável"** quando órfã;
- não renderizar `User` com uma string obrigatória;
- na edição, proprietário ou gestor carrega os membros do projeto e seleciona um novo `Member.id`;
- enviar o valor selecionado em `ownerkey`;
- membros comuns podem ver a indicação, mas não o controle de reatribuição.

O seletor utilizado na criação de tarefa (`SelectMember`) pode ser reutilizado.

### Comentários

Alterar `CommentCard.owner` para `string | null` e usar:

```tsx
const authorName = comment.ownerkey ?? "Usuário removido";
```

O componente `User` já possui fallback para "Usuário removido"; pode ser reutilizado no card em vez de duplicar essa regra.

### Transferência de propriedade

Na tela existente `screens/Organization`:

- remover `OWNER` das opções de papel inicial;
- para cada afiliação não proprietária, oferecer a ação **"Transferir propriedade"** somente ao proprietário atual;
- exigir confirmação explícita, informando que o proprietário atual se tornará
  `MEMBER`;
- chamar o novo endpoint;
- recarregar as afiliações e o contexto da organização;
- atualizar o papel local do usuário atual para `MEMBER`, evitando que a UI continue exibindo ações de proprietário com um contexto antigo.

## Segurança e escopo

Todas as mutações devem cruzar o alvo com `x-org-key`; nunca confiar apenas no ID recebido na URL ou no body.

Em especial:

- transferência: `Affiliation.id + Affiliation.orgkey`;
- edição de gestor: `Project.id + Project.orgkey` e
  `Affiliation.id + Affiliation.orgkey`;
- edição de responsável: `Task.projectkey` e `Member.projectkey`;
- remoção de afiliação: `Affiliation.id + Affiliation.orgkey`.

O `PermissionGuard` atual não extrai corretamente o alvo de todos os formatos de rota/body. As validações acima devem existir no service/repository mesmo que o guard também seja ajustado. Isso evita associação entre organizações por IDs válidos descobertos externamente.

## Arquivos com alteração esperada

### API

- `prisma/schema.prisma`
- nova migration em `prisma/migrations`
- `src/modules/accounts/account.repository.ts`
- `src/modules/affiliations/affiliations.controller.ts`
- `src/modules/affiliations/affiliations.service.ts`
- `src/modules/affiliations/affiliations.repository.ts`
- DTOs de afiliação, quando necessário para o retorno
- `src/modules/projects/dto/edit.dto.ts`
- `src/modules/projects/project.service.ts`
- `src/modules/projects/projects.repository.ts`
- novo `src/modules/tasks/dto/edit.dto.ts`
- `src/modules/tasks/task.controller.ts`
- `src/modules/tasks/tasks.service.ts`
- `src/modules/tasks/tasks.repository.ts`
- DTOs de projeto, tarefa e comentário
- testes dos módulos alterados

### Frontend

- tipos de projeto, tarefa e comentário;
- `service/modules/project/project.service.ts`;
- `service/modules/task/task.service.ts`;
- `service/modules/affiliation/affiliation.service.ts`;
- `screens/Organization`;
- `screens/Profile` e, opcionalmente, um popup de conflito de propriedade;
- `screens/Projects` e `components/cards/ProjectCard`;
- `screens/Project/Edit`;
- `screens/Project/Tasks` e `components/cards/TaskCard`;
- `screens/Project/TaskOverview`;
- `components/cards/CommentCard`;
- mocks dos serviços alterados.

## Ordem recomendada de implementação

1. Alterar schema, gerar migration e regenerar o Prisma Client.
2. Implementar e testar o bloqueio de exclusão por organização.
3. Implementar e testar a transferência transacional.
4. Restringir criação/promoção/remoção de afiliações `OWNER`.
5. Permitir edição validada de `Project.managerkey`.
6. Permitir edição validada de `Task.ownerkey`.
7. Atualizar DTOs nullable e consultas.
8. Atualizar serviços, tipos, mocks e telas do frontend.
9. Executar testes unitários e um fluxo integrado com banco.

## Critérios de aceite

### Exclusão

- usuário com uma ou várias organizações recebe `409` ao excluir a conta;
- ao receber `409` com a mensagem `Usuário possui organizações`, tanto a
  exclusão do perfil quanto a exclusão da conta exibem o modal com a orientação
  para transferência de liderança;
- o conflito não encerra a sessão, não navega para `/login` e não gera também
  um toast genérico;
- após transferir ou excluir todas as organizações próprias, a conta pode ser excluída;
- projeto gerenciado pelo usuário excluído permanece com `managerkey = null`;
- tarefa do usuário excluído permanece com `ownerkey = null`;
- comentário do usuário excluído permanece com `ownerkey = null`;
- audit log permanece com `actorkey = null`;
- nenhuma organização fica sem proprietário.

### Transferência

- somente o proprietário atual transfere a propriedade;
- o alvo pertence à mesma organização;
- `Organization.ownerkey` passa a ser o username do alvo;
- a afiliação alvo passa a `OWNER`;
- a afiliação anterior passa a `MEMBER`;
- continua existindo exatamente uma afiliação `OWNER`;
- IDs de `Affiliation`, `Member`, `Project` e `Task` não são recriados;
- projetos e tarefas já vinculados ao novo proprietário permanecem vinculados;
- falha em qualquer update desfaz toda a operação.

### Reatribuição e interface

- proprietário edita o gestor de um projeto;
- somente uma afiliação `MANAGER` da mesma organização é aceita;
- projeto sem gestor exibe "Projeto sem gestor";
- proprietário ou gestor edita o responsável de uma tarefa;
- somente um `Member` do mesmo projeto é aceito;
- tarefa sem responsável exibe "Sem responsável";
- comentário sem autor exibe "Usuário removido";
- os tipos e componentes não lançam erro quando `manager`, `owner` ou `ownerkey` são `null`.
