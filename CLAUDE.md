# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Tasker API is a NestJS + Prisma backend for a project/team management tool (Portuguese-language domain: organizations, projects, tasks, members, comments, events, stats). Auth is JWT-based; authorization is a custom RBAC+ABAC layer (see below). All routes are served under the `/api/v1` prefix.

## Commands

```bash
npm run dev              # start with watch mode (nest start --watch)
npm start                # start (no watch)
npm run start:debug      # start with --debug --watch
npm run build            # nest build -> ./build
npm run prod             # run compiled build (node build/main.js)

npm run lint             # eslint --fix on src/apps/libs/test
npm run format           # prettier --write src/**/*.ts test/**/*.ts

npm test                 # jest unit tests (*.spec.ts, colocated with source)
npm run test:watch
npm run test:cov
npm run test:e2e         # jest --config ./test/jest-e2e.json (*.e2e-spec.ts under test/)

# Run a single unit test file, e.g.:
npx jest src/modules/tasks/tasks.service.spec.ts

npm run prisma:generate  # regenerate Prisma client into generated/prisma (required after clone/schema change)
npm run migrate          # prisma migrate dev (creates+applies migration from schema diff)
npm run migrate:new -- <name>   # named migration
npm run migrate:deploy   # apply pending migrations (staging/prod)
npm run migrate:reset    # drop db, reapply all migrations (destructive)
npm run prisma:seed      # idempotent dev seed (accounts use @tasker.dev emails, passwords Senha@01, Senha@02, ...)
```

Requires Node 20 and a Postgres database. Env vars (see `.env`, gitignored): `DB_URL`, `DIRECT_URL`, `API_PORT`/`PORT`, `SECRET` (JWT), `ORGANIZATION_INVITE_SECRET`, `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET`. Read via `src/config/env.config.ts`.

The Prisma client is generated to `generated/prisma` (not `node_modules/@prisma/client`) and is gitignored — always run `npm run prisma:generate` after pulling schema changes. Import types/enums from `generated/prisma` (e.g. `OrgRole`, `PrismaClient`), not from `@prisma/client`.

## Path aliases

Defined in `tsconfig.json` (build) and mirrored in `package.json`'s `jest.moduleNameMapper` (tests) — keep both in sync when adding a new alias:

| Alias | Path |
| --- | --- |
| `@modules/*` | `src/modules/*` |
| `@security/*` | `src/security/*` |
| `@permissions/*` | `src/permissions/*` |
| `@authorization/*` | `src/authorization/*` |
| `@guards/*` | `src/guards/*` |
| `@decorators/*` | `src/decorators/*` |
| `@exceptions/*` | `src/common/errors/*` |
| `@filters/*` | `src/common/filters/*` |
| `@interfaces/*` | `src/common/interfaces/*` |
| `@enums/*` | `src/common/enums/*` |
| `@config/*` | `src/config/*` (tsconfig only) |
| `@interceptors/*` | `src/common/interceptors/*` (tsconfig only) |

## Architecture

### Module layout

Each domain module under `src/modules/<name>/` follows: `*.controller.ts` → `*.service.ts` → `*.repository.ts` (thin Prisma wrapper), plus a `dto/` folder. Modules: `accounts`, `users`, `organization`, `affiliations` (+ `invites/` sub-feature for link-based org invites), `projects`, `members`, `tasks`, `comments`, `events`, `stats`, `deadlines`, `audit-log`, `upload`. Auth lives outside `modules/` in `src/security/`.

### Response envelope

Every JSON handler returns a fixed envelope, built manually in the controller and sent via `res.status(...).json(...)` (there's a `ResponseInterceptor` in `common/filters/response.filter.ts` but it is **not** wired up globally — envelopes are constructed by hand per-handler):

```ts
{ status: number, data: T, message: string, timestamp: string /* ISO 8601 */, path: string }
```

Errors follow a parallel shape with `errors: ApiErrorItem[]` instead of `data`/`message`, produced by the global exception filters registered in `main.ts` (`InternalExceptionFilter`, `BusinessExceptionFilter`, `ValidationExceptionFilter` — note Nest evaluates global filters in reverse registration order). `ApiErrorItem.level` is one of `info | warning | error | critical | validation`. The one exception to the envelope is `POST /project/:id/stats/report`, which streams a PDF (`application/pdf`).

Many DTOs are plain `interface`/`type` (erased at compile time) rather than validated classes, so despite the global `ValidationPipe` (`whitelist/forbidNonWhitelisted/transform: true`), only some DTOs (e.g. account/user creation, login, stats query DTOs) actually validate at runtime. When adding request validation, make the DTO a class with `class-validator` decorators.

### Authorization: RBAC + ABAC via decorators, guard, registry, policies

This is the architectural core of the app; full design rationale lives in `context/contexto_modulo_permissionamento.md`. Flow:

1. `JwtAuthGuard` (`src/security/auth.guard.ts`) validates the bearer token and attaches `request.user` (identity only — no role/permission logic).
2. Controllers declare intent via metadata decorators: `@Role(...OrgRole)`, `@Action(BaseActions | EnhancedActions)`, `@Resource(Resources)` (all in `src/decorators/`). A route with neither `@Role` nor `@Action` skips authorization entirely once `PermissionGuard` runs.
3. `PermissionGuard` (`src/guards/permission.guard.ts`) reads those decorators via `Reflector`, reads the `x-org-key` header (`@OrgKey()`), pulls `request.user`, extracts a target id by checking `body.id` / `body.project` / `body.projectkey` / `params.id` / `params.projectkey` / `params.code` (in that order), builds an `AccessContext`, and calls `PermissionService.can(ctx)`. Missing user or org key → `UnauthorizedException`; failed policy → `AccessDeniedException`.
4. `PermissionService` (`src/permissions/permission.service.ts`) looks up the caller's `OrgRole` for the active org (via `AffiliationService`), checks it against the route's allowed roles, then builds the key `` `${role}:${resource}:${action}` `` and looks it up in `AccessValidatorRegistry`.
5. `AccessValidatorRegistry` (`src/authorization/access-control/access-control.registry.ts`) is a singleton `Map<"ROLE:RESOURCE:ACTION", ResourcePolicyHandler>`, populated once at boot by `AccessControlBootstrap` (`onModuleInit`) from static arrays (`MemberAccessHandlers`, `ManagerAccessHandlers`, `OwnerAccessHandlers`) in the same file. **Adding a new role/resource/action combination means adding an entry to one of these arrays** — an unregistered key always denies access (fail-closed).
6. The resolved policy (`src/authorization/policies/*.policy.ts`, implementing `ResourcePolicyHandler.validate(subject, resource)`) does the fine-grained domain check (ownership, membership, management), delegating to domain services like `AffiliationService`/`ProjectService`.

Every protected endpoint therefore stacks `@UseGuards(JwtAuthGuard)` at the controller level and `@UseGuards(PermissionGuard)` per-handler alongside `@Role`/`@Action`/`@Resource` (see `src/modules/projects/project.controller.ts` for the canonical example).

### Identifier map (don't confuse these)

```
Account.id        -> JWT `sub`, User.accountkey
User.username      -> Affiliation.userkey, Organization.ownerkey
Affiliation.id     -> Project.managerkey, Member.userkey
Member.id          -> Task.ownerkey
```

`x-org-key` selects the active organization for every request that passes through `PermissionGuard`; it's not required for register/login or for creating an organization.

### Data model (Prisma, `prisma/schema.prisma`)

Postgres via `PrismaService` (`src/database/prisma.service.ts`, a thin `PrismaClient` subclass connected/disconnected on module init/destroy). Core chain: `Organization` → `Project` → `Task`/`Comment`/`Event`, with `Affiliation` (user × org × `OrgRole`) and `Member` (affiliation × project) as the two join layers that everything else hangs off of. Stats live in `TaskWorkLog`, `ProjectStatsPeriodSnapshot` (+ `ProjectStatsPeriodTask`), and `ProjectStatsReport` (generated PDF reports, optionally linked back to a snapshot). `AuditLog` records actor/action/resource/changes and survives deletion of its organization/actor (`onDelete: SetNull`) by design — see `context/contexto_transferencia_propriedade_e_entidades_orfas.md` for the orphan-preservation/ownership-transfer rules this supports.

### Stats module

`src/modules/stats/` is the most involved module: `repositories/` split by concern (`project-stats-query`, `project-stats-period-snapshots`, `project-stats-period-tasks`, `project-stats-reports`, `task-work-logs`), plus `project-stats-report.document.ts` which renders PDF reports with `pdfkit` from `modules/stats/assets/` (registered as a Nest CLI asset in `nest-cli.json`). Report generation and lookups are reached only through `ProjectController`'s `/project/:id/stats*` routes (see project.controller.ts), not a dedicated stats controller.

## Project documentation (`context/`)

`context/` (gitignored except `prisma/seed.ts`, not committed) contains detailed, current, hand-maintained design docs in Portuguese — one per module plus cross-cutting docs for HTTP contracts, permissions, schema relations, and ownership-transfer/orphan-entity rules. Start at `context/README.md` for the index. These are more detailed and more current than this file for module-specific behavior (declared vs. actually-wired endpoints, DTO validation coverage, known limitations) — prefer them over re-deriving that detail from scratch.

## Response/DTO conventions worth knowing before changing endpoints

- Dates serialize as ISO 8601 strings; don't type API responses as `Date`.
- Enums (`OrgRole`, `ProjectStage`, `TaskStage`, `TaskPriority`, `EventCategory`, `StatsPeriodType`, `ProjectHealthStatus`, ...) are transported as their literal string values — no server-side translation/label mapping.
- Success envelopes must not use `204 No Content` (it strips the body); use `200` even for deletions so the envelope survives.
