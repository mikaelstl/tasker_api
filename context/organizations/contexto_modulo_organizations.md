# Contexto do módulo Organizations

## Endpoints

| Método | Rota | Permissão | Entrada | Status | `data` |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/org` | JWT | `OrganizationCreateDTO` | `201` | `OrganizationDTO` |
| `DELETE` | `/org/del/:id` | JWT + `OWNER` + `ORGS:DEL` | ID da organização | `201` | `OrganizationDTO` excluída |

`POST /org` não exige `x-org-key`: a organização ainda não existe. O backend ignora qualquer `ownerkey` enviado e usa o `username` do JWT. Depois de criar a organização, cria também uma afiliação `OWNER` para esse usuário.

```http
POST /org
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{ "name": "Equipe Tasker" }
```

Para excluir, envie também `x-org-key: <id-da-organizacao>`.

## DTOs

### `OrganizationCreateDTO`

```ts
class OrganizationCreateDTO {
  name: string;      // obrigatório e não vazio
  ownerkey?: string; // declarado, mas definido pelo backend a partir do JWT
}
```

Como `ownerkey` não possui decorator de validação e o pipe usa `whitelist`, ele tende a ser removido do body. O frontend deve enviar somente `name`.

### `OrganizationDTO`

```ts
interface OrganizationDTO {
  id: string;
  name: string;
  ownerkey: string; // username do proprietário
  owner?: UserDTO;
  projects?: ProjectDTO[];
  members?: AffiliationDTO[];
  created_at: string;
  updated_at: string;
}
```

Na criação, as relações opcionais não são incluídas. Na exclusão, o repository inclui `projects` e `members`, portanto `data` pode conter as duas coleções com o estado anterior à remoção.

## Retorno padrão

```ts
interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  path: string;
  timestamp: string;
}
```

## Observações para o frontend

- Após criar, recarregue `GET /affiliations` e selecione o novo `orgkey`.
- Não existe endpoint de editar ou buscar organização neste controller.
- A exclusão usa `201`, embora semanticamente fosse esperado `200` ou `204`; trate o contrato atual.
- A autorização da exclusão deve confirmar no backend que `:id` e `x-org-key` são a mesma organização; hoje há risco de divergência.
