# Contexto do módulo Deadlines

## Objetivo

Este módulo não expõe endpoints e não possui DTOs HTTP. É um job interno executado a cada minuto pelo `@nestjs/schedule`.

## Operação interna

```ts
async markOverdueEntities(now = new Date()): Promise<{
  projects: number;
  tasks: number;
}>;
```

Em uma transação, o job:

- define `Project.delayed = true` quando `deadline < now`, `delayed` ainda é falso e o estágio não é `COMPLETED`;
- define `Task.delayed = true` quando `deadline < now`, `delayed` ainda é falso e o estágio não é `DONE`.

Retorno interno de exemplo:

```json
{ "projects": 2, "tasks": 5 }
```

Esse objeto serve para testes e chamadas internas; não chega ao frontend.

## Impacto no frontend

- `delayed` pode mudar sem ação do usuário e deve ser tratado como estado vindo do servidor.
- Ao recarregar projetos/tarefas ou stats, invalide indicadores locais que dependam do prazo.
- Não existe polling, websocket ou notificação neste módulo; atualização em tempo real precisa ser implementada separadamente.
- O job não altera `stage` e não cria audit logs na implementação atual.
