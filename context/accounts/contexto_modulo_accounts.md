# Contexto do módulo Accounts

## Visão geral

O módulo cria credenciais de acesso e mantém a identidade formada por `Account`
e `User`. O cadastro é público; a edição e a exclusão da identidade exigem JWT.
As respostas usam o envelope `ApiResponse<T>`.

```ts
interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  path: string;
  timestamp: string; // ISO 8601
}
```

## Endpoints

| Método | Rota | Autenticação | Entrada | Status | `data` |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/accounts/register/` | Pública | `CreateAccountDTO` no body | `201` | `AccountDTO` |
| `PATCH` | `/accounts/me` | Bearer JWT | `EditAccountDTO` no body | `200` | `AccountIdentityDTO` |
| `DELETE` | `/accounts/me` | Bearer JWT | nenhuma | `200` | `null` |

### Criar conta

```http
POST /accounts/register/
Content-Type: application/json
```

```json
{
  "email": "ana@example.com",
  "password": "Senha#123"
}
```

Retorno efetivo: o Prisma devolve também `created_at` e `updated_at`. No código atual, o hash de `password` também é devolvido em `data`; o frontend não deve armazená-lo nem depender dele.

### Editar usuário e conta

```http
PATCH /accounts/me
Authorization: Bearer <token>
Content-Type: application/json
```

Todos os campos são opcionais, permitindo alterar somente os dados desejados:

```json
{
  "name": "Ana Souza",
  "username": "ana-souza",
  "email": "ana.souza@example.com",
  "password": "NovaSenha#123"
}
```

A senha é cifrada antes da persistência. Usuário e conta são atualizados na mesma
transação, e a resposta nunca contém a senha ou seu hash.

### Excluir usuário e conta

```http
DELETE /accounts/me
Authorization: Bearer <token>
```

A conta é identificada exclusivamente pelo `sub` do JWT. A remoção da conta e do
perfil associado ocorre na mesma transação. Não é possível apontar outro usuário
ou e-mail pela URL. Se o usuário ainda possuir recursos protegidos por vínculo
relacional (por exemplo, uma organização sob sua responsabilidade), a API retorna
`409` em vez de remover esses recursos implicitamente.

## DTOs

### `CreateAccountDTO` — body de cadastro

```ts
class CreateAccountDTO {
  email: string;    // obrigatório e e-mail válido
  password: string; // 8–20 caracteres, ao menos 1 número e 1 de @ $ #
}
```

Propriedades extras são rejeitadas pelo `ValidationPipe` global.

### `AccountDTO` — retorno declarado

```ts
interface AccountDTO {
  id?: string;
  email: string;
  password: string;
}
```

### `EditAccountDTO` — edição da identidade atual

```ts
class EditAccountDTO {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
}
```

E-mail e senha seguem as mesmas regras de validação do cadastro.

### `AccountIdentityDTO` — retorno da edição

```ts
interface AccountIdentityDTO {
  account: {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
  user: {
    id: string;
    name: string;
    username: string;
    accountkey: string;
    created_at: string;
    updated_at: string;
  };
}
```

Forma efetiva do registro Prisma:

```ts
type AccountResponse = {
  id: string;
  email: string;
  password: string;   // hash; não usar no frontend
  created_at: string; // Date serializada em ISO 8601
  updated_at: string;
};
```

## Observações para o frontend

- O fluxo de cadastro de perfil é separado: primeiro a conta, depois `POST /users`.
- A API não retorna cookie; o token só é obtido em `POST /auth/login`.
- Trate o status HTTP real como fonte de verdade e descarte `data.password` imediatamente.
- Se `username` ou `email` forem alterados, faça novo login para obter um JWT com
  os dados atualizados.
