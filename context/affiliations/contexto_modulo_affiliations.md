# Contexto do módulo Affiliations

## Visão geral

Uma afiliação liga um `User` a uma `Organization` e define o papel desse usuário na organização. O papel é contextual ao `orgkey`, não global.

## Endpoints

| Método | Rota | Permissão | Entrada | Status | `data` |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/affiliations` | `OWNER`, `AFFILIATIONS:CREATE` | `DefineAffiliationDTO` | `201` | `AffiliationDTO` |
| `GET` | `/affiliations` | JWT | nenhuma | `200` | `UserOrganizationSummaryDTO[]` |
| `GET` | `/affiliations/participates/:orgkey` | JWT | `orgkey` na rota | `200` | `boolean` |
| `DELETE` | `/affiliations/remove/:id` | `OWNER`, `AFFILIATIONS:DEL` | ID da afiliação | `200` | `null` no envelope padrão |
| `PATCH` | `/affiliations/promote/:id` | `OWNER`, `AFFILIATIONS:PROMOTE` | ID da afiliação | `200` | `AffiliationDTO \| APIMessage` |
| `PATCH` | `/affiliations/demote/:id` | `OWNER`, `AFFILIATIONS:DEMOTE` | ID da afiliação | `200` | `AffiliationDTO \| APIMessage` |

Todas as mutações exigem `Authorization: Bearer <token>` e `x-org-key`. Os dois endpoints de leitura sem `@Action` exigem apenas JWT devido ao retorno antecipado do `PermissionGuard`.

### Criar afiliação

```json
{
  "orgkey": "org-id",
  "userkey": "ana",
  "role": "MEMBER"
}
```

`role` é opcional; o banco assume `MEMBER`. O frontend deve preencher `orgkey` com a organização ativa e enviar em `userkey` o `username`, não o ID da conta.

### Listar organizações do usuário

```json
{
  "status": 200,
  "message": "Organizações do usuário encontradas.",
  "data": [
    {
      "orgkey": "org-id",
      "role": "OWNER",
      "name": "Equipe Tasker",
      "projects": 4,
      "members": 8
    }
  ],
  "path": "/affiliations",
  "timestamp": "2026-07-21T18:00:00.000Z"
}
```

### Promover e rebaixar

Fluxo de promoção: `MEMBER -> MANAGER -> OWNER`. Fluxo de rebaixamento implementado: `MANAGER -> MEMBER`. OWNER não é rebaixado por esta operação. Quando não há transição, `data` pode ser:

```ts
interface APIMessage {
  message: string;
  timestamp: string;
}
```

## DTOs

```ts
type OrgRole = "OWNER" | "MANAGER" | "MEMBER";

interface DefineAffiliationDTO {
  orgkey: string;
  userkey: string; // username
  role?: OrgRole;
}

interface AffiliationEditDTO {
  orgkey?: string;
  userkey?: string;
  role?: OrgRole;
}

interface AffiliationQuery {
  id?: string;
  orgkey?: string;
  userkey?: string;
  role?: OrgRole;
}

interface AffiliationDTO {
  id: string;
  orgkey: string;
  userkey: string;
  role: OrgRole;
  org?: OrganizationDTO;
  user?: UserDTO; // o arquivo hoje tipa incorretamente como OrganizationDTO
}

interface UserOrganizationSummaryDTO {
  orgkey: string;
  role: OrgRole;
  name: string;
  projects: number;
  members: number;
}
```

O registro Prisma simples também contém `created_at` e `updated_at`, embora esses campos não estejam no `AffiliationDTO`. Os DTOs deste módulo são interfaces e, portanto, não executam validação em runtime.

## Observações para o frontend

- Use `GET /affiliations` para montar o seletor de organização e obter o papel atual.
- A listagem resumida não traz o ID da própria afiliação; ele não pode ser inferido de `orgkey`.
- A remoção retorna `200` e o envelope padrão, com `data: null`; o
  frontend pode fazer parse de JSON normalmente.
- O backend ainda não valida, em todas as mutações, que o ID-alvo pertence ao `x-org-key`; não exponha IDs de outra organização, mas a correção definitiva deve ser no servidor.
