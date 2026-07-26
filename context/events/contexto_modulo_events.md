# Contexto do módulo Events

## Visão geral

Eventos representam marcos de calendário de um projeto.

> Estado de registro: `EventsModule` está importado diretamente no `AppModule` e suas rotas ficam disponíveis na aplicação executada.

## Endpoints declarados

| Método | Rota | Permissão | Entrada | Status | Retorno |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/events` | `EVENTS:CREATE` | `EventCreateDTO` | `201` | `ApiResponse<EventDTO>` |
| `GET` | `/events` | `EVENTS:SEEK` | `EventQueryDTO` | `200` | `ApiResponse<EventDTO[]>` |
| `GET` | `/events/:code` | `EVENTS:SEEK` | na prática `Event.id` | `200` | `ApiResponse<EventDTO>` |
| `PUT` | `/events/:code` | `EVENTS:EDIT` | atualização sem DTO | `200` | `ApiResponse<EventDTO>` |
| `DELETE` | `/events/:id` | `EVENTS:DEL` | `Event.id` | `200` | `ApiResponse<EventDTO>` |

Todas exigem Bearer JWT e `x-org-key`.

### Criar

```json
{
  "title": "Reunião de revisão",
  "project": "project-id",
  "date": "2026-07-25T14:00:00.000Z",
  "category": "REVIEW"
}
```

## DTOs

```ts
type EventCategory =
  | "RELEASE"
  | "MEETING"
  | "REVIEW"
  | "PLANNING"
  | "TESTS"
  | "LAUNCH";

interface EventCreateDTO {
  title: string;
  project: string; // Project.id
  date: string;    // ISO 8601
  category: EventCategory;
}

interface EventQueryDTO {
  id?: string;
  title?: string;
  projectkey?: string;
  date?: string;
  // category não está declarado, embora exista no model
}

interface EventDTO {
  id: string;
  title: string;
  projectkey: string;
  date: string;
  category: EventCategory; // existe no retorno Prisma, falta no DTO fonte
  created_at: string;
  updated_at: string;
}

interface EditEventDTODeFato {
  title?: string;
  date?: string;
  category?: EventCategory;
  projectkey?: string;
}
```

Não existe DTO de edição e todos os DTOs existentes são interfaces sem validação em runtime.

## Limitações atuais

- O model `Event` não possui `code`; os handlers `/:code` repassam esse valor para uma consulta por `id`.
- `EventsRepository.exists()` conta tarefas (`prisma.task`) em vez de eventos.
- O guard não extrai o projeto do body/query em create/list e trata IDs de evento como IDs de projeto em outras operações.
- OWNER possui apenas `EVENTS:SEEK` na matriz atual; create/edit/delete não estão registrados para esse papel.
- Todos os endpoints JSON usam o envelope `ApiResponse<T>`.
