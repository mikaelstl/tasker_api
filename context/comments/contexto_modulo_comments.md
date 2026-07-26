# Contexto do módulo Comments

## Endpoints

| Método | Rota | Permissão | Entrada | Status | Retorno |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/comments` | `COMMENTS:CREATE` | `CreateCommentDTO` | `201` | `ApiResponse<CommentDTO>` |
| `GET` | `/comments` | `COMMENTS:SEEK` | `CommentQueryDTO` | `200` | `ApiResponse<CommentDTO[]>` |
| `GET` | `/comments/:id` | `COMMENTS:SEEK` | `Comment.id` | `200` | `ApiResponse<CommentDTO>` |
| `DELETE` | `/comments/del/:id` | `COMMENTS:DEL` | `Comment.id` | `200` | `ApiResponse<CommentDTO>` |

Todas as rotas exigem Bearer JWT e `x-org-key`.

### Criar

```json
{
  "content": "A revisão foi concluída.",
  "date": "2026-07-21T18:00:00.000Z",
  "ownerkey": "ana",
  "projectkey": "project-id"
}
```

No código atual, `ownerkey` vem do cliente. O contrato seguro deveria obtê-lo do JWT (`CurrentAccount.username`) e deixar `date` opcional, aproveitando o default do banco.

### Listar

Queries opcionais: `id`, `projectkey`, `ownerkey` e `date`. Para a tela do projeto, use `?projectkey=<id>`.

## DTOs

```ts
interface CreateCommentDTO {
  content: string;
  date: string;       // Date no backend, ISO 8601 no JSON
  ownerkey: string;   // User.username
  projectkey: string; // Project.id
}

interface CommentQueryDTO {
  id?: string;
  projectkey?: string;
  ownerkey?: string;
  date?: string;
}

interface CommentDTO {
  id: string;
  content: string;
  date: string;
  ownerkey: string;
  projectkey: string;
  created_at: string;
  updated_at: string;
}
```

Os DTOs são interfaces, então não validam formato, campos obrigatórios ou propriedades extras em runtime.

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

## Limitações atuais

- OWNER não possui chave `OWNER:COMMENTS:SEEK` registrada, embora tenha create/edit/delete.
- Não existe endpoint `PUT`, apesar de o repository possuir `edit()`.
- No create/list, o guard não extrai `projectkey` do body/query, o que pode gerar `403`.
- Em find/delete, o guard interpreta `Comment.id` como projeto nas políticas de manager/owner.
- Para MEMBER, delete depende de ownership por `ownerkey === username`, que é a relação correta no schema.
