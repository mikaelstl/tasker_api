# Contexto do módulo Stats

## Visão geral

O módulo agrega tarefas, membros, eventos e apontamentos de trabalho de um projeto. Não possui controller próprio: suas rotas são publicadas pelo `ProjectController`.

Todas as rotas exigem:

```http
Authorization: Bearer <token>
x-org-key: <organization-id>
```

O metadata usa corretamente `Resources.PROJECT_STATS`; os handlers aceitam apenas `OWNER` e `MANAGER`.

## Endpoints

| Método | Rota | Entrada | Status | Retorno |
| --- | --- | --- | --- | --- |
| `GET` | `/project/:id/stats` | `ProjectStatsQueryDTO` | `200` | `ApiResponse<ProjectStats>` |
| `POST` | `/project/:id/stats/report` | `GenerateStatsReportDTO` | `200` | arquivo PDF binário |
| `GET` | `/project/:id/stats/reports` | nenhuma | `200` | `ApiResponse<ProjectStatsReportDTO[]>` |
| `GET` | `/project/:id/stats/reports/:reportkey` | ID do relatório | `200` | `ApiResponse<ProjectStatsReportDTO>` |

Não existem endpoints públicos para work logs, snapshots ou download posterior do PDF já gerado.

## DTOs de entrada

### `ProjectStatsQueryDTO`

```ts
class ProjectStatsQueryDTO {
  cutoffAt?: string; // ISO 8601 válido; padrão: agora
}
```

Uso:

```http
GET /project/project-id/stats?cutoffAt=2026-07-21T18:00:00.000Z
```

### `GenerateStatsReportDTO`

```ts
type StatsPeriodType = "WEEK" | "MONTH" | "QUARTER";

class GenerateStatsReportDTO {
  periodType?: StatsPeriodType; // padrão WEEK
  cutoffAt?: string;            // ISO 8601; padrão agora
}
```

```json
{
  "periodType": "MONTH",
  "cutoffAt": "2026-07-21T18:00:00.000Z"
}
```

Os DTOs são classes e são validados. Propriedades extras são rejeitadas. `fileUrl` não faz parte do contrato HTTP atual.

## DTO principal de retorno

Datas abaixo são `Date` no backend e strings ISO 8601 no JSON.

```ts
type ProjectHealthStatus = "SAFE" | "WARNING" | "CRITICAL";
type TaskStage = "STARTED" | "PENDING" | "IN_PROGRESS" | "REVIEW" | "DONE";

interface ProjectStats {
  generatedAt: string;
  cutoffAt: string;
  period: { start: string; end: string } | null;
  project: {
    id: string;
    title: string;
    stage: string;
    startedAt: string | null;
    doneAt: string | null;
    deadline: string;
    delayed: boolean;
    organization: string;
    manager: string | null;
  };
  summary: {
    totalTasks: number;
    doneTasks: number;
    openTasks: number;
    startedTasks: number;
    reviewTasks: number;
    delayedTasks: number;
    progress: number; // 0–100
  };
  deadline: {
    dueDate: string;
    daysLeft: number; // negativo quando vencido
  };
  health: {
    status: ProjectHealthStatus;
    score: number; // 0–100
    reason: string;
    projectedDeliveryAt: string | null;
  };
  performancePerMember: MemberPerformanceDTO[];
  productivity: MemberProductivityDTO[];
  members: MemberStatsDTO[];
  events: StatsEventDTO[];
}

interface StatsUserDTO {
  username: string;
  name: string;
  photoUrl: string | null;
}

interface StatsTaskDTO {
  id: string;
  code: string;
  name: string;
  stage: TaskStage;
  delayed: boolean;
  spentMinutes: number;
  deadline: string;
  startedAt: string | null;
  doneAt: string | null;
}

interface MemberPerformanceDTO {
  memberId: string;
  user: StatsUserDTO;
  months: Array<{
    month: string;        // YYYY-MM
    averageHours: number;
  }>;
  averageHoursPerMonth: number;
}

interface MemberProductivityDTO {
  memberId: string;
  completed: number;
  delayed: number;
  ratio: number;
}

interface MemberStatsDTO {
  memberId: string;
  user: StatsUserDTO;
  completedTasks: number;
  delayedTasks: number;
  startedTasks: number;
  reviewTasks: number;
  tasks: StatsTaskDTO[];
}

interface StatsEventDTO {
  id: string;
  title: string;
  date: string;
  category: string;
}
```

## Relatório PDF

```http
POST /project/:id/stats/report
Content-Type: application/json
```

O retorno não usa `ApiResponse`. É um `application/pdf` com:

```text
Content-Disposition: attachment; filename="relatorio-desempenho-<projeto>-<data>.pdf"
Content-Length: <bytes>
Cache-Control: private, no-store
X-Content-Type-Options: nosniff
```

No frontend, configure a chamada como `blob`/`arrayBuffer`, extraia o nome de `Content-Disposition` e crie o download. O backend expõe `Content-Disposition` e `Content-Length` no CORS.

Gerar o PDF também persiste um snapshot e um `ProjectStatsReport`, mas o binário não é persistido nem há URL no registro.

## DTO de relatório persistido

```ts
interface ProjectStatsReportDTO {
  id: string;
  projectkey: string;
  generated_at: string;
  cutoff_at: string;
  period_type: StatsPeriodType;
  snapshotkey: string | null;
  file_url: string | null; // permanece null no fluxo HTTP atual
  payload_json: {
    stats: ProjectStats;
    snapshot: ProjectStatsSnapshotDTO;
    historicalSnapshots: ProjectStatsSnapshotRecordDTO[];
  } | null;
  created_at: string;
  updated_at: string;
}
```

A listagem retorna `payload_json` completo e pode ser pesada. `GET .../:reportkey` confirma que o relatório pertence ao projeto informado; caso contrário retorna `404`.

Estruturas de snapshot usadas dentro do payload:

```ts
interface ProjectStatsSnapshotRecordDTO {
  id: string;
  projectkey: string;
  period_type: StatsPeriodType;
  period_start: string;
  period_end: string;
  generated_at: string;
  cutoff_at: string;
  performance_per_member_json: unknown;
  productivity_json: unknown;
  summary_json: unknown;
  health_status: ProjectHealthStatus;
  health_score: number;
  created_at: string;
  updated_at: string;
}

interface ProjectStatsSnapshotDTO extends ProjectStatsSnapshotRecordDTO {
  periodTasks: Array<{
    snapshotkey: string;
    taskkey: string;
    memberkey: string;
    spent_minutes: number;
    started_at: string | null;
    done_at: string | null;
  }>;
}
```

## Regras resumidas de cálculo

- `progress = doneTasks / totalTasks * 100`; sem tarefas, `0`.
- `startedTasks` inclui `STARTED`, `PENDING` e `IN_PROGRESS`.
- Tarefa atrasada: flag persistida, prazo vencido enquanto aberta, ou conclusão após o prazo.
- `ratio = completed / max(delayed, 1)`; não é porcentagem.
- `daysLeft` é positivo antes do prazo e negativo após o prazo.
- `spentMinutes` prefere work logs; sem logs, usa o ciclo entre início e conclusão/corte.
- A série atual é mensal (`months[].averageHours`), apesar de versões anteriores da documentação mencionarem semanas.

## Bloqueio técnico atual

O schema foi alterado de `Project.owner`/`ownerkey` para `Project.org`/`orgkey`, mas `ProjectStatsQueryRepository` ainda inclui `owner` e `StatsService` ainda lê `project.owner.name`. Com o Prisma Client alinhado ao schema novo, o módulo precisa ser atualizado antes de compilar e responder.
