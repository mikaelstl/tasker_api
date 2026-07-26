# Índice dos contextos da API

## Contratos gerais

- `application_context.md`: visão funcional do produto.
- `contexto_contratos_http_e_dtos.md`: envelope JSON obrigatório, erros, datas,
  headers e convenções; o download de PDF é a exceção binária.
- `contexto_permissionamento_frontend.md`: lógica de autorização para o frontend.
- `contexto_modulo_permissionamento.md`: lógica interna do backend para
  autenticação, RBAC/ABAC, registry de policies e liberação de ações.
- `contexto_schema_relacoes_e_mocks.md`: relações do schema e mocks.
- `contexto_endpoints_current_account_org_key.md`: uso de conta atual e organização ativa.
- `contexto_transferencia_propriedade_e_entidades_orfas.md`: transferência de
  proprietário, exclusão de conta, preservação e reatribuição de projetos,
  tarefas e comentários órfãos.

## Contextos por módulo

- `app/contexto_modulo_app.md`
- `accounts/contexto_modulo_accounts.md`
- `auth/contexto_modulo_auth.md`
- `users/contexto_modulo_users.md`
- `organizations/contexto_modulo_organizations.md`
- `affiliations/contexto_modulo_affiliations.md`
- `projects/contexto_modulo_projects.md`
- `members/contexto_modulo_members.md`
- `tasks/contexto_modulo_tasks.md`
- `comments/contexto_modulo_comments.md`
- `events/contexto_modulo_events.md`
- `stats/contexto_modulo_stats.md`
- `auditlog/contexto_modulo_auditlog.md`
- `deadlines/contexto_modulo_deadlines.md`
- `upload/contexto_modulo_upload.md`

Cada contexto de módulo separa endpoints disponíveis/declarados, formato de retorno, DTOs de entrada/saída e limitações observadas no código atual.
