# Endpoints com conta atual e organização ativa

## Contratos

`@CurrentAccount()` lê `request.user`, preenchido pelo JWT:

```ts
type CurrentAccountDTO = {
  id: string;       // JWT.sub = Account.id
  username: string;
  email: string;
};
```

`@OrgKey()` lê:

```http
x-org-key: <Organization.id>
```

Mesmo quando um handler não declara `@OrgKey()`, o `PermissionGuard` exige o header sempre que há metadata de ação/papel a validar.

## Uso direto de `@CurrentAccount()`

| Endpoint | Uso efetivo |
| --- | --- |
| `POST /org` | define `Organization.ownerkey = account.username` |
| `GET /affiliations` | lista organizações de `account.username` |
| `GET /affiliations/participates/:orgkey` | verifica participação de `account.username` |
| `GET /project/list` e `GET /project/:id` | identifica o usuário para aplicar o escopo de visualização de projetos |
| demais handlers que o declaram | parâmetro não usado diretamente; o guard já lê `request.user` |

`@CurrentAccount()` também aparece, sem uso local, nas mutações de Affiliations, nas rotas de Projects e nas rotas de Members.

## Uso direto de `@OrgKey()`

| Endpoint | Uso no handler |
| --- | --- |
| `POST /project` | injeta a organização ativa como `orgkey` na criação |
| `GET /project/list` | filtra a organização ativa e aplica o escopo da role |
| `GET /project/:id` | restringe a busca à organização ativa antes de validar o vínculo do usuário |

Nos fluxos de projeto, a organização vem do header e é aplicada como
`Project.orgkey`; ela não é escolhida pelo body ou pelas queries.

## Onde `x-org-key` é exigido indiretamente

São as rotas com `PermissionGuard` e `@Action`/`@Role`:

- exclusão de Organization;
- criação, remoção, promoção e rebaixamento de Affiliation;
- todas as rotas de Project e Project Stats;
- todas as rotas de Members;
- todas as rotas de Tasks;
- todas as rotas de Comments;
- todas as rotas de Events.

Exceções relevantes:

- `POST /org` exige JWT, mas não `x-org-key`;
- `GET /affiliations` e `GET /affiliations/participates/:orgkey` passam pelo guard sem ação/papel e não exigem `x-org-key` no comportamento atual;
- Accounts, Users e Auth não usam permissionamento por organização.

## Extração do alvo pelo guard

```ts
targetkey =
  request.body?.id
  ?? request.params?.id
  ?? request.params?.projectkey
  ?? request.params?.code;
```

Queries e campos como `body.project`/`body.projectkey` não são considerados. Isso afeta especialmente create/list de Members, Tasks, Comments e Events. O frontend deve enviar os contratos documentados, mas não consegue corrigir esse problema de autorização; o backend precisa normalizar a extração do projeto-alvo por rota.
