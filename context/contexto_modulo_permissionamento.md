# Contexto do módulo de permissionamento

Este documento descreve o modelo de autorização da Tasker API a partir da implementação atual em:

- `src/guards/permission.guard.ts`;
- `src/permissions/permission.service.ts`;
- `src/authorization/access-control/*`;
- `src/authorization/policies/*`;
- `src/decorators/Role.ts`;
- `src/decorators/Action.ts`;
- `src/decorators/Resource.ts`;
- `src/decorators/OrgKey.ts`;
- `src/security/auth.guard.ts`;
- serviços de domínio que expõem as verificações `belongs`, `participates`, `manage` e equivalentes.

O objetivo aqui não é só explicar o que o código faz, mas registrar o padrão de projeto usado para que ele possa ser reaplicado em outros sistemas.

## 1. Visão geral

O permissionamento combina três camadas:

1. autenticação do usuário;
2. identificação do contexto organizacional;
3. autorização por papel, recurso, ação e relação com o objeto.

Na prática, o sistema trabalha com uma variação de RBAC + ABAC:

- RBAC, porque a decisão começa pelo papel do usuário na organização (`OWNER`, `MANAGER`, `MEMBER`);
- ABAC, porque a liberação final depende do recurso alvo e da relação do usuário com esse recurso, como ser dono, membro, gerente ou autor.

O backend é fail-closed: se faltar identidade, organização, ação, recurso ou política registrada, o acesso é negado.

## 2. Componentes principais

### 2.1 `JwtAuthGuard`

O `JwtAuthGuard` valida o `Bearer token`, verifica a assinatura com o segredo configurado e injeta no request um objeto `user` com os dados mínimos de identidade:

- `id`;
- `username`;
- `email`.

Esse guard não resolve papel nem permissão. Ele só estabelece quem é o ator.

### 2.2 Decorators de metadados

Os decorators funcionam como uma camada declarativa sobre cada endpoint:

- `@Role(...)` define quais papéis podem tentar a ação;
- `@Action(...)` define a ação de domínio, como `CREATE`, `EDIT`, `DEL`,
  `SEEK`, `PROMOTE`;
- `@Resource(...)` define o tipo de recurso, como `PROJECTS`, `TASKS`, `COMMENTS`;
- `@OrgKey()` lê o header `x-org-key`.

Esses metadados não executam autorização por si só. Eles apenas descrevem a intenção do endpoint para o guard.

### 2.3 `PermissionGuard`

O `PermissionGuard` é o ponto de entrada da autorização.

Ele executa esta sequência:

1. lê, via `Reflector`, os metadados de `Role`, `Action` e `Resource`;
2. lê o header `x-org-key`;
3. recupera `request.user` preenchido pelo `JwtAuthGuard`;
4. extrai um identificador alvo da requisição, procurando em:
   - `body.id`
   - `body.project`
   - `body.projectkey`
   - `params.id`
   - `params.projectkey`
   - `params.code`
5. monta um `AccessContext`;
6. chama `PermissionService.can(...)`;
7. lança `UnauthorizedException` para ausência de identidade ou organização;
8. lança `AccessDeniedException` quando a regra de negócio de acesso falha.

Esse guard é o ponto que “libera” ou “bloqueia” a execução do handler.

### 2.4 `PermissionService`

O serviço de permissão faz a decisão central.

Ele:

1. descobre o papel real do usuário na organização atual;
2. valida se esse papel está entre os papéis permitidos no endpoint;
3. monta a chave de política no formato:

```ts
`${role}:${resource}:${action}`
```

4. consulta o `AccessValidatorRegistry`;
5. executa a policy associada;
6. retorna `true` apenas se a policy validar.

O serviço não conhece detalhes de banco, relações ou regras de negócio
específicas. Ele apenas orquestra a decisão.

### 2.5 `AccessControlBootstrap` e `AccessValidatorRegistry`

O `AccessValidatorRegistry` é um mapa singleton de:

```ts
Map<"ROLE:RESOURCE:ACTION", ResourcePolicyHandler>
```

O `AccessControlBootstrap` popula esse registro no `onModuleInit`, usando listas
estáticas que associam cada combinação permitida à policy responsável.

Isso separa duas responsabilidades:

- definição declarativa da matriz de acesso;
- implementação concreta da verificação.

### 2.6 Policies

Cada policy implementa `ResourcePolicyHandler` e expõe:

```ts
validate(subject: AccessSubject): Promise<boolean>
```

A policy só responde uma pergunta: “este usuário pode executar esta ação
sobre este recurso, neste contexto?”.

As policies usam serviços de domínio como `OrganizationService`,
`ProjectService`, `TasksService` e `CommentsService` para aplicar regras
de pertencimento, autoria, gerência e visibilidade.

## 3. Modelo de dados do contexto

O contexto de autorização é representado por `AccessContext`:

```ts
type AccessSubject = {
  userkey: string;
  orgkey: string;
  targetkey: string;
  projectkey?: string;
  taskcode?: string;
  taskkey?: string;
  commentkey?: string;
  eventkey?: string;
};

interface AccessContext {
  action: BaseActions | EnhancedActions;
  resource: Resources;
  roles: OrgRole[];
  subject: AccessSubject;
}
```

Esse objeto concentra os dados necessários para decidir acesso sem depender do controller diretamente.

## 4. Como as permissões são definidas

O sistema usa uma matriz `papel × recurso × ação` registrada no bootstrap.

Exemplos da implementação atual:

- `OWNER:PROJECTS:CREATE` → `OrganizationOwnershipPolicy`;
- `OWNER:PROJECTS:EDIT` → `ProjectOwnershipPolicy`;
- `MANAGER:PROJECTS:SEEK` → `ManagerProjectVisibilityPolicy`;
- `MEMBER:TASKS:EDIT` → `TasksOwnershipPolicy`;
- `OWNER:AFFILIATIONS:GENERATE_INVITE` → `OrganizationOwnershipPolicy`.

Essa matriz define duas coisas ao mesmo tempo:

1. quais combinações existem;
2. qual policy decide cada combinação.

Se a chave não existir no registry, o acesso falha.

## 5. Como o usuário é liberado para executar uma ação

O fluxo real é este:

1. o request chega ao controller;
2. `JwtAuthGuard` valida o token e injeta `request.user`;
3. o endpoint carrega os metadados de `Role`, `Action` e `Resource`;
4. o `PermissionGuard` lê `x-org-key`;
5. o guard monta o contexto com usuário, organização e recurso alvo;
6. `PermissionService` busca a role do usuário naquela organização;
7. a role é comparada com as roles permitidas no endpoint;
8. a chave `role:resource:action` é consultada no registry;
9. a policy correspondente executa as regras de domínio;
10. se tudo passar, o handler é executado.

Em resumo: o usuário não é liberado apenas por estar autenticado; ele precisa
estar autenticado, pertencer ao contexto certo e satisfazer a regra específica
da ação.

## 6. Papel das policies concretas

### Organização

- `OrganizationOwnershipPolicy`
  - valida se o usuário é dono da organização.
- `OrganizationMembershipPolicy`
  - valida se o usuário participa da organização.

### Projeto

- `ProjectOwnershipPolicy`
  - exige que o usuário seja dono da organização;
  - se houver alvo, exige que o projeto pertença à organização ativa.
- `ProjectManagementPolicy`
  - valida se o usuário gerencia o projeto.
- `ProjectMembershipPolicy`
  - valida se o usuário participa do projeto.
- `MemberProjectVisibilityPolicy`
  - valida se o projeto pertence à organização ativa e se o usuário participa
    do projeto.
- `ManagerProjectVisibilityPolicy`
  - valida se o projeto pertence à organização ativa e se o usuário gerencia
    ou participa do projeto.

### Tarefa

- `TasksOwnershipPolicy`
  - valida propriedade da tarefa;
  - em alguns casos, usa `projectkey + taskcode` para validar posse composta.

### Comentário

- `CommentOwnershipPolicy`
  - valida se o comentário pertence ao usuário.

Essas policies empurram a regra fina para os serviços de domínio, que sabem
consultar o banco e interpretar as relações reais.

## 7. Técnicas usadas

### 7.1 Decorator-driven authorization

Os controllers declaram autorização por metadados, não por if/else espalhado.
Isso reduz acoplamento e torna o endpoint autoexplicativo.

### 7.2 Policy-based authorization

Cada combinação relevante de papel, recurso e ação aponta para uma policy.
A regra fica isolada, testável e substituível.

### 7.3 Registry + bootstrap

A resolução de policies não depende de `switch` central no guard.
O bootstrap registra as policies uma vez, e o guard só consulta o registry.

### 7.4 Separação entre autorização e regra de negócio

O guard responde “pode entrar neste endpoint?”.
O serviço responde “a operação é válida em termos de domínio?”.

Essa separação evita misturar controle de acesso com invariantes de negócio.

### 7.5 Fail-closed

Se faltar qualquer dado crítico, o sistema nega acesso.
Isso evita permissões implícitas por omissão.

### 7.6 Contexto organizacional explícito

O header `x-org-key` define a organização ativa.
Isso evita dedução ambígua por parâmetros do corpo ou por sessão global.

## 8. Padrão de aplicação em outros sistemas

Para reutilizar essa técnica em outro sistema, a estrutura mínima é:

1. definir a identidade do ator no request;
2. definir o contexto de escopo, como organização, tenant, workspace ou conta;
3. criar decorators de metadados para `role`, `action` e `resource`;
4. implementar um guard que:
   - leia metadados;
   - monte um contexto;
   - invoque um serviço central;
5. implementar um registry de policies;
6. registrar policies em bootstrap;
7. mover a verificação fina para serviços de domínio;
8. usar o mesmo vocabulário de ação e recurso em todos os módulos.

Esse padrão funciona bem quando existe:

- multi-tenancy;
- papéis diferentes por escopo;
- regras diferentes por recurso;
- necessidade de bloquear visualização e operação com critérios distintos.

## 9. Limites e observações da implementação atual

- O `PermissionGuard` só protege rotas onde ele é aplicado.
- O contexto de alvo é extraído por heurística do request; em endpoints novos,
  vale padronizar `params` e `body` para evitar ambiguidade.
- O registro de policies depende das combinações cadastradas no bootstrap.
  Adicionar uma nova ação ou recurso exige atualizar essa matriz.
- A autorização no guard não substitui validações internas dos serviços, como
  checagem de dono, vínculo de projeto ou integridade de afiliação.

## 10. Resumo operacional

O permissionamento segue este contrato:

- autentica quem é o usuário;
- identifica em qual organização ele age;
- lê a intenção do endpoint;
- consulta a role atual do usuário naquele escopo;
- resolve a policy correspondente;
- executa a validação fina;
- libera a execução apenas se tudo bater.

Esse desenho é simples de ler, fácil de expandir e adequado para sistemas com
autorização por escopo e por relação com entidade.
