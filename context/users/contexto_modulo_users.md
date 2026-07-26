# Contexto do módulo Users

## Visão geral

`User` é o perfil associado a uma conta. Sua chave relacional principal é `username`; `accountkey` aponta para `Account.id`.

## Endpoints

| Método | Rota | Autenticação | Entrada | Status | `data` |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/users` | Pública | `CreateUserDTO` | `201` | `UserDTO` |
| `GET` | `/users` | Bearer JWT | nenhuma | `200` | `UserDTO[]` |
| `GET` | `/users` | Bearer JWT | `UserQueryDTO` | `200` | `UserDTO` |
| `GET` | `/users/me` | Bearer JWT | nenhuma | `200` | `UserProfileDTO` |

Os dois handlers `GET /users` têm método e caminho idênticos. Em Nest/Express, o primeiro registrado tende a capturar a rota, deixando a busca por query inacessível. O backend deve separar as rotas, por exemplo `GET /users` e `GET /users/search` ou `GET /users/:username`.

A edição e a remoção do perfil não são operações isoladas deste módulo. Elas
pertencem ao fluxo único da identidade autenticada em `PATCH /accounts/me` e
`DELETE /accounts/me`, que também atualiza ou remove a respectiva `Account`.

### Consultar o próprio perfil

`GET /users/me` usa o `Account.id` presente em `JWT.sub` para localizar o perfil
e retorna somente os dados públicos solicitados:

```json
{
  "name": "Ana Silva",
  "username": "ana",
  "email": "ana@email.com"
}
```

### Criar perfil

```json
{
  "name": "Ana Silva",
  "username": "ana",
  "accountkey": "account-id"
}
```

`orgkey` existe no DTO, mas não possui decorator de validação, é removido pelo whitelist e não é usado pelo repository.

## DTOs

```ts
class CreateUserDTO {
  name: string;       // obrigatório
  username: string;   // obrigatório e chave pública do usuário
  orgkey?: string;    // legado/não utilizado
  accountkey: string; // obrigatório; Account.id
}

interface UserQueryDTO {
  id?: string;
  name?: string;
  username?: string;
  orgkey?: string;
  accountkey: string; // declarado obrigatório no TypeScript
  member_in?: string;
}

interface UserDTO {
  id?: string;
  name: string;
  username: string;
  accountkey: string;
  created_at: string;
  updated_at: string;
}

interface UserProfileDTO {
  name: string;
  username: string;
  email: string;
}

type CurrentAccountDTO = {
  id: string;       // Account.id, vindo de JWT.sub
  username: string;
  email: string;
};
```

O arquivo `edit-user.dto.ts` exporta por engano uma segunda interface chamada `UserQueryDTO`; não há endpoint público de edição.

## Observações para o frontend

- Fluxo atual de cadastro: `POST /accounts/register/` e depois `POST /users` com o `Account.id` retornado.
- Edição e exclusão são feitas por `/accounts/me`; não envie username ou e-mail
  na URL para escolher o usuário alvo.
- Os dados atuais do usuário autenticado são consultados em `GET /users/me`.
- A criação de perfil é pública e aceita `accountkey` do cliente; o servidor deveria vincular esse fluxo por token/convite para evitar associação indevida.
- A listagem devolve todos os campos escalares, incluindo timestamps.
- Não há permissionamento por organização neste controller.
