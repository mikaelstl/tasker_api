# Contexto do módulo Auth

## Endpoints

| Método | Rota | Autenticação | Entrada | Status | `data` |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/auth` | Pública | nenhuma | `200` | `ApiResponse<null>` |
| `POST` | `/auth/login` | Pública | `LoginDTO` | `200` | `ApiResponse<AuthDTO>` |
| `GET` | `/auth/validate` | header Bearer lido manualmente | nenhuma | `200` | `ApiResponse<boolean>` |

### Status

`GET /auth` retorna o envelope padrão:

```json
{
  "status": 200,
  "message": "Autenticação disponível.",
  "data": null,
  "path": "/auth",
  "timestamp": "2026-07-22T18:00:00.000Z"
}
```

### Login

```json
{
  "email": "ana@example.com",
  "password": "Senha#123"
}
```

```json
{
  "status": 200,
  "message": "Autenticação realizada com sucesso.",
  "data": {
    "account": "account-id",
    "email": "ana@example.com",
    "username": "ana",
    "access_token": "<jwt>"
  },
  "path": "/auth/login",
  "timestamp": "2026-07-21T18:00:00.000Z"
}
```

Payload do JWT:

```ts
interface JWTPayload {
  sub: string;      // Account.id
  username: string;
  email: string;
  iat?: number;
  exp?: number;     // configuração atual: 1 dia
}
```

### Validar token

```http
GET /auth/validate
Authorization: Bearer <token>
```

Quando válido, `data` é `true`. Token ausente, inválido, expirado ou cuja conta não existe produz erro de autenticação. O controller chama `split()` diretamente; header ausente pode terminar como erro interno em vez de `401`.

## DTOs

```ts
class LoginDTO {
  email: string;    // obrigatório; não usa @IsEmail neste DTO
  password: string; // obrigatório
}

interface AuthDTO {
  account: string;     // Account.id
  email: string;
  username: string;
  access_token: string;
}
```

## Uso no frontend

- Guarde `access_token` no mecanismo de sessão escolhido e envie `Authorization: Bearer <token>` nas rotas protegidas.
- Não derive o papel do JWT. Após login, carregue `GET /affiliations`; o papel muda por organização.
- A validação do token não renova sua expiração.
- Senha incorreta retorna `401`; conta/usuário inexistente pode retornar `404` conforme o ponto da falha.
