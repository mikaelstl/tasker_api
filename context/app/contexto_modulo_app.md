# Contexto do módulo App

## Endpoint

| Método | Rota | Autenticação | Status | Retorno |
| --- | --- | --- | --- | --- |
| `GET` | `/status` | Pública | `200` | `ApiResponse<{ activated: boolean }>` |

```json
{
  "status": 200,
  "message": "API disponível.",
  "data": { "activated": true },
  "path": "/status",
  "timestamp": "2026-07-22T18:00:00.000Z"
}
```

Esse endpoint utiliza o envelope `ApiResponse` e não possui DTO de entrada.
Pode ser usado como health check básico do processo HTTP, mas não comprova
acesso ao banco ou aos serviços externos.

## Módulos conectados à aplicação

Todos os módulos funcionais estão registrados diretamente no `AppModule`:

- Accounts, Auth, Users e Upload;
- Organizations, Affiliations, Projects e Members;
- Tasks, Comments, Events e Stats;
- Deadlines e Audit Log.

Também fazem parte do módulo raiz os módulos de infraestrutura Prisma, Schedule,
Permission, Access Control e Policies. Com esse grafo, os controllers de Members,
Tasks, Comments, Events e Upload publicam suas rotas na aplicação executada. O
StatsModule não possui controller próprio; suas operações são expostas pelo
`ProjectController`.
