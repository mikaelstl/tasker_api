# Contexto da Tela de Stats do Projeto

> Nota de atualização (2026-07-21): este arquivo preserva as decisões de produto e o histórico da proposta da tela. O contrato HTTP e as estruturas efetivamente implementadas estão em [`contexto_modulo_stats.md`](./contexto_modulo_stats.md) e têm precedência em caso de divergência. O schema já recebeu work logs, snapshots, relatórios, timestamps de ciclo de vida e flags booleanas de atraso.

> Este documento descreve o que precisa existir no backend para alimentar a tela de estatísticas do projeto mostrada na imagem de referência.
> A proposta abaixo usa o `prisma/schema.prisma` atual como base e recomenda apenas os acréscimos mínimos necessários quando o schema atual nao for suficiente.

---

## Objetivo da tela

A tela concentra a leitura operacional de um projeto em um unico lugar:

- situacao geral do projeto;
- quantidade de tarefas abertas e concluidas;
- previsao de entrega e risco de atraso;
- desempenho individual por membro;
- produtividade individual por membro;
- detalhamento de tarefas e tempo gasto por membro.

A melhor implementacao para esse tipo de pagina e um unico endpoint agregado, porque a tela precisa de varios blocos de dados relacionados entre si.

Recomendacao de contrato:

- `GET /project/:id/stats`

Esse endpoint deve retornar um payload unico com todos os blocos usados pela tela.

---

## Base do schema atual

O schema atual ja cobre parte importante da tela:

- `Project` tem `deadline` e `stage`;
- `Task` tem `stage`, `deadline`, `projectkey` e `ownerkey`;
- `Member` liga projeto e afiliacao;
- `Affiliation` liga usuario e organizacao;
- `User` guarda o nome exibido;
- `Image` pode fornecer avatar;
- `TaskStage` separa `STARTED`, `PENDING`, `IN_PROGRESS`, `REVIEW` e `DONE`; atraso é representado por `Task.delayed`.

Relacoes relevantes para a tela:

- `Project -> Task[]`
- `Project -> Member[]`
- `Member -> Affiliation -> User -> Image?`
- `Task -> Project`
- `Task -> Member`

Ponto importante:

- `Member.user` nao aponta direto para `User`, e sim para `Affiliation`;
- para mostrar nome e avatar do membro, o backend precisa atravessar `Member.user -> Affiliation.user -> User` e, se necessario, `User.photo`.

---

## O que ja pode ser calculado sem mudar o schema

Esses blocos podem ser calculados por requisicao apenas com os dados atuais:

- total de tarefas abertas;
- total de tarefas concluidas;
- total de tarefas atrasadas;
- total de tarefas iniciadas;
- total de tarefas em revisao, se a UI continuar exibindo essa coluna;
- dias restantes ate o vencimento do projeto;
- produtividade simples baseada em tarefas concluidas e atrasadas;
- totais por membro com base nas tarefas atualmente atribuídas.

Esses calculos devem ser feitos no backend em tempo de requisicao, porque:

- mudam com frequencia;
- nao justificam duplicacao imediata no banco;
- sao agregacoes simples sobre `Task`.

---

## O que falta no schema para a tela ficar correta

O schema atual nao guarda tempo gasto em tarefas.

Sem esse dado, a tela nao consegue responder de forma confiavel:

- quantas horas cada membro gastou;
- a media de horas por semana por membro;
- a listagem de tarefas com tempo gasto por tarefa;
- uma previsao de entrega mais consistente que considere ritmo real de execucao.

Tambem faltam timestamps de ciclo de vida do projeto e da tarefa:

- `Project.started_at`;
- `Project.done_at`;
- `Task.started_at`;
- `Task.done_at`.

Esses campos sao importantes porque a tela e o relatorio de desempenho nao devem depender apenas do status atual. Eles precisam saber quando o trabalho realmente iniciou e quando foi encerrado.

## Mudancas minimas recomendadas

### 1. Adicionar um historico simples de tempo gasto

Recomendacao minima:

- criar uma tabela nova de apontamento de tempo, por exemplo `TaskWorkLog`;
- essa tabela deve ligar:
  - `taskkey -> Task.id`
  - `memberkey -> Member.id`
  - `spent_minutes`
  - `logged_at`

Campos sugeridos:

- `id`
- `taskkey`
- `memberkey`
- `spent_minutes`
- `logged_at`
- `created_at`
- `updated_at`

Opcional, mas util:

- `note` para observacao do apontamento;
- `source` para indicar se o tempo veio de timer manual, fechamento de tarefa ou importacao.
- `spent_minutes` deve ser calculado através do calculo: `Task.done_at` - `Task.started_at`, caso `done_at`não esteja definido, deve ser calculado da seguinte forma: momento da requisição - `Task.started_at`;

OBS.: O intuito de calcular pelo momento da requisição é informar o tempo que o usuário está levando naquela tarefa, indicar ao usuário final o tempo que está sendo gasto naquela tarefa, até o momento da conclusão. Com a tarefa concluída, indicar ao usuário o tempo que o usuário levou para finalizá-la.

Por que isso e necessario:

- a media de horas por semana depende de historico temporal;
- o resumo de tempo por tarefa depende de registros acumulados;
- o grafico de performance por membro precisa de series semanais.

### 2. Adicionar timestamps de ciclo de vida na `Task`

Recomendacao minima para melhorar a previsao de entrega:

- `started_at?: DateTime`
- `done_at?: DateTime`

Esses campos ajudam o backend a medir:

- ritmo real de conclusao;
- tempo entre inicio e conclusao;
- velocidade recente do projeto;
- previsao de atraso com menos chute e mais sinal historico.

Se a prioridade for manter o schema ainda mais simples, esses campos podem ser adiados, mas a precisao da previsao de entrega cai.

### 2.1. Cobrir os timestamps em `Project` e `Task`

Regra de negocio recomendada:

- `Task.started_at` deve registrar o instante em que a tarefa passou a ser executada;
- `Task.done_at` deve registrar o instante em que a tarefa foi marcada como concluida;
- `Project.started_at` deve registrar o inicio formal do projeto;
- `Project.done_at` deve registrar o encerramento formal do projeto.

Uso pratico:

- `started_at` ajuda a calcular lead time, tempo de ciclo e ritmo de execucao;
- `done_at` ajuda a congelar o historico usado no relatorio;
- o relatorio precisa usar esses marcos para saber ate qual ponto do tempo as informacoes sao validas.

Regra importante:

- o tempo gasto em uma tarefa nao é o tempo em que o usuario ficou com a tela aberta;
- o tempo gasto e medido ate o momento em que o usuario conclui a tarefa;
- isso significa que o dado de tempo deve vir de um registro de trabalho ou de um evento de conclusao com carimbo temporal, e nao de presenca ativa na interface.

### 3. Opcional: adicionar estimativa na tarefa (Opcional, ignore)

Se quiser uma previsao melhor sem complicar a modelagem:

- `estimated_minutes?: Int`

Isso ajuda o backend a comparar:

- esforço previsto;
- esforço consumido;
- produtividade por membro;
- risco de atraso por volume de trabalho.

Essa e uma melhoria opcional. Para a primeira versao, o historico de tempo ja resolve a parte de horas.

### 4. Cobrir atraso em `Project` e `Task`

Regra de negocio recomendada:

- as entidades devem cobrir os campos `Task.delayed` e `Project.delayed` que são booleanos que indicam se a tarefa e o projeto estão atrasados. Passando o status DELAYED/OVERDUE a ser um estado indicativo da entidade, permitindo o seguintes cenários:

Tarefa concluída com atraso:
```json
{
  "task": {
    "id": "xxxxx",
    "...": "...",
    "stage": "DONE",
    "delayed": true
  }
}
```

Tarefa pendente com atraso:
```json
{
  "task": {
    "id": "xxxxx",
    "...": "...",
    "stage": "PENDING",
    "delayed": true
  }
}
```

Uso pratico:
- Diferencia o estágio da tarefa do estado, permitindo indicar ao usuário quais tarefas estão atrasadas independente do estágio delas. Podendo também ser exibido no relatório de desempenho.

---

## O que cada bloco da tela precisa

### 1. Cabecalho do projeto

Mostra:

- nome do projeto;
- badge de status;
- data de inicio, se existir no front;
- data de entrega estimada;
- acoes como editar e gerar relatorio.

Fonte dos dados:

- `Project.title`
- `Project.stage`
- `Project.deadline`
- `Project.started_at`

Calculo:

- `progress` deve ser calculado pelo total de tarefas concluídas dividido pelo total de tarefas seguindo o calculo: total de concluidas/total de tarefas;
- o texto da data final vem de `deadline`;
- o texto da data de inicio vem de `started_at`;
- `Generate Report` pode reutilizar o mesmo payload do endpoint de stats.

### 2. Barra de progresso geral

Regra informada pelo usuario:

- representa a porcentagem de tarefas concluidas;

Definicao recomendada:

- concluidas = `Task.stage = DONE`;
- abertas = qualquer `Task.stage != DONE`.

Calculo:

- `doneCount = count(stage = DONE)`
- `total = count(Task.project = projectkey)`: `projectkey` será informado na requisição
- `progressPercent = doneCount / total`

Observacao:

- uma tarefa com `delayed = true` continua aberta quando `stage != DONE`, mas também pode estar `DONE` e preservar o fato de ter sido concluída com atraso.

### 3. Card de quantidade total de tarefas

O card pode exibir:

- total de tarefas;
- concluidas;
- em andamento;
- atrasadas.

Fonte:

- `Task.stage`
- `Task.deadline`

Calculo:

- total = quantidade de tarefas do projeto;
- concluidas = `DONE`;
- em andamento = `STARTED`, `PENDING`, `IN_PROGRESS`;
- revisao = `REVIEW`, se a UI mantiver essa informacao;
- atrasadas = `delayed = true`, prazo vencido com `stage != DONE`, ou conclusão registrada após o prazo.

Recomendacao:

- manter atraso separado do estágio, usando `delayed`, `deadline`, `done_at` e `stage`.

### 4. Card de deadline

Mostra:

- data de vencimento do projeto;
- dias restantes.

Fonte:

- `Project.deadline`

Calculo:

- `daysLeft = deadline - now` em dias inteiros;
- se `daysLeft < 0`, o projeto ja passou do prazo.

Esse bloco deve ser calculado por requisicao.

### 5. Project Health

Esse bloco precisa responder:

- o projeto sera entregue na data estimada;
- existe chance de atraso;
- existe alta chance de atraso.

## Regra recomendada

Como o schema atual nao possui estimativa formal por tarefa nem historico de transicao de status, o backend deve trabalhar com duas camadas:

### Camada 1, usando apenas o schema atual

Entradas:

- `deadline`;
- total de tarefas;
- tarefas concluidas;
- tarefas atrasadas;
- tarefas abertas;
- tendencia simples de conclusao, se houver historico recente no momento da requisicao.

Classificacao sugerida:

- `SAFE` quando a razao de conclusao indica entrega antes ou no prazo;
- `WARNING` quando o ritmo atual encosta no prazo;
- `CRITICAL` quando o ritmo indica que a entrega vai passar do prazo ou quando o volume atrasado e alto.

### Camada 2, com as mudancas minimas recomendadas

Se existir `TaskWorkLog` e timestamps de ciclo de vida:

- o backend pode medir velocidade real;
- pode estimar entrega por ritmo de conclusao;
- pode calcular risco com base em tarefas fechadas por periodo e horas gastas.

## Recomendacao pratica

- calcular `Project Health` por requisicao;
- nao salvar o status no banco como fonte principal;
- se o projeto tiver muitos registros, pode haver cache curto ou snapshot, mas isso e otimizacao, nao requisito inicial.

## Regras novas de persistencia para estatisticas

A tela pode continuar calculando varios blocos por requisicao, mas algumas informacoes precisam ser persistidas porque vao alimentar o relatorio manual e os graficos historicos.

### O que deve ser persistido

- registros brutos de tempo gasto por tarefa e membro;
- timestamps de inicio e conclusao de projeto e tarefa;
- snapshots agregados por periodo para `performancePerMember` e `productivity`;
- relatorios gerados manualmente com o recorte de tempo usado.

### O que nao deve ser persistido como fonte principal

- contadores simples da tela atual;
- progresso geral calculado a partir das tarefas;
- `Project Health` calculado a partir do estado corrente.

Esses valores devem continuar sendo derivados, porque eles mudam com frequencia e podem ser recalculados a qualquer momento.

### Melhor abordagem para salvar `performancePerMember` e `productivity`

A melhor abordagem e separar em duas camadas:

1. camada bruta, com os eventos e tempos reais por tarefa;
2. camada agregada, com snapshots por periodo.

Isso evita salvar a mesma informacao varias vezes sem necessidade e permite montar semanal, mensal e trimestral sem perder rastreabilidade.

#### Camada bruta recomendada

Criar uma tabela de tempo por tarefa, por exemplo `TaskWorkLog`, com:

- `id`;
- `projectkey`;
- `taskkey`;
- `memberkey`;
- `minutes`;
- `logged_at`;
- `created_at`;
- `updated_at`.

Essa tabela e a origem de verdade para horas gastas.

Se o sistema quiser registrar o momento da conclusao como fonte de tempo minimo, o backend pode criar o log no instante em que a tarefa muda para `DONE`.

#### Camada agregada recomendada

Criar uma tabela de snapshot, por exemplo `ProjectStatsPeriodSnapshot`, com:

- `id`;
- `projectkey`;
- `period_type` com valores `WEEK`, `MONTH`, `QUARTER`;
- `period_start`;
- `period_end`;
- `generated_at`;
- `cutoff_at`;
- `performance_per_member_json`;
- `productivity_json`;
- `summary_json`;
- `health_status`;
- `health_score`.

Essa tabela guarda o agregado pronto para tela e relatorio.

#### Como salvar por semanas, meses e trimestres

O periodo precisa ser normalizado em uma chave clara:

- semana: `period_type=WEEK`, `period_start=segunda-feira`, `period_end=domingo`;
- mes: `period_type=MONTH`, `period_start=primeiro dia`, `period_end=ultimo dia`;
- trimestre: `period_type=QUARTER`, `period_start=primeiro dia do trimestre`, `period_end=ultimo dia do trimestre`.

Regras de calculo:

- cada snapshot deve representar um unico periodo fechado;
- o snapshot deve armazenar apenas o intervalo que ele cobre;
- se o relatorio for gerado no meio do periodo, o `cutoff_at` deve limitar os dados considerados.

#### Como salvar a relacao entre tarefas e o periodo

Para manter rastreabilidade, o snapshot deve guardar a associacao com as tarefas que entraram no calculo.

Recomendacao simples:

- criar uma tabela pivô, por exemplo `ProjectStatsPeriodTask`;
- ela deve ligar:
  - `snapshotkey -> ProjectStatsPeriodSnapshot.id`;
  - `taskkey -> Task.id`;
  - `memberkey -> Member.id`;
  - `spent_minutes`;
  - `done_at`;
  - `started_at`.

Assim o sistema consegue responder:

- quais tarefas compuseram o periodo;
- quanto tempo cada tarefa consumiu no periodo;
- qual membro participou daquele resultado.

Se quiser manter ainda mais simples, o snapshot pode guardar so os agregados e a relacao detalhada pode ficar apenas no `TaskWorkLog`. Porem a tabela pivô facilita auditoria e relatórios mais fiéis.

### Quando gerar e salvar o snapshot

- gerar ao fechar o periodo;
- gerar quando o usuario pedir o relatorio manual, se o snapshot ainda nao existir;
- nunca substituir o historico anterior;
- sempre criar um novo snapshot por periodo e por corte temporal.

### Relatorio manual de desempenho

O relatorio sera disparado manualmente por:

- `POST /projects/:id/stats/report`

Fluxo recomendado:

1. o backend identifica o projeto;
2. define o `cutoff_at` como o momento da requisicao;
3. busca os snapshots ja salvos ate esse instante;
4. se faltar periodo atual, recalcula apenas o trecho necessario;
5. monta o relatorio com base em:
   - dados do projeto;
   - tarefas;
   - logs de tempo;
   - snapshots agregados;
6. salva um registro do relatorio gerado.

O relatorio nao deve depender de calculos em memoria sem persistencia, porque ele precisa poder ser refeito ou auditado depois.

### Tabela sugerida para o relatorio

Se o produto precisar guardar historico de geracao, vale criar algo como `ProjectStatsReport` com:

- `id`;
- `projectkey`;
- `generated_at`;
- `cutoff_at`;
- `period_type`;
- `snapshotkey` opcional, se o relatorio apontar para um snapshot especifico;
- `file_url` ou `payload_json`, dependendo da forma de entrega.

Isso deixa claro quando o relatorio foi gerado e com qual recorte.

### 6. Performance per member

Esse grafico representa:

- a media de horas que cada membro gastou por semana;
- uma serie temporal por membro;
- nao apenas o total geral.

Fonte necessaria:

- `TaskWorkLog` ou tabela equivalente;
- `Task -> Member`;
- `Member -> Affiliation -> User`.

Calculo:

- agrupar registros por semana;
- somar os minutos por membro;
- converter para horas;
- dividir pelo numero de semanas do recorte, se o grafico mostrar media semanal.

Exemplo de leitura:

- semana 1: horas gastas por membro;
- semana 2: horas gastas por membro;
- media do periodo: soma das horas / numero de semanas.

Recomendacao:

- esse dado deve ser salvo no banco como apontamento de tempo;
- o grafico em si deve ser calculado por requisicao.

Motivo:

- o front precisa do agregado;
- o banco precisa apenas do evento bruto de tempo.

### 7. Productivity

Esse grafico e uma relacao simples entre:

- tarefas concluidas;
- tarefas atrasadas;
- por membro.

Fonte:

- `Task.stage`;
- `Task.ownerkey`.

Calculo sugerido:

- `completedCount` por membro = tarefas com `stage = DONE`;
- `delayedCount` por membro = tarefas com `delayed = true`, vencidas e abertas, ou concluídas após o prazo;
- produtividade pode ser uma razao simples, por exemplo:
  - `completedCount - delayedCount`;
  - ou `completedCount / max(delayedCount, 1)`;

Recomendacao:

- escolher uma formula unica e fixa no backend;
- nao deixar o front inventar essa conta.

Esse bloco deve ser calculado por requisicao.

### 8. Members

Essa secao precisa mostrar, por membro:

- total de tarefas concluidas;
- total de tarefas atrasadas;
- total de tarefas iniciadas;
- opcionalmente total em revisao, se a interface mantiver essa coluna;
- lista de tarefas;
- tempo gasto em cada tarefa;
- nome e avatar do usuario.

Fonte:

- `Project.members`;
- `Member.tasks`;
- `Member.user.user` para chegar no `User`;
- `User.photo` para avatar, se existir;
- `Task.stage`;
- `Task.deadline`;
- `TaskWorkLog` para horas.

Calculo por membro:

- concluidas = tarefas do membro com `DONE`;
- atrasadas = tarefas do membro marcadas com `delayed`, vencidas e abertas, ou concluídas após o prazo;
- iniciadas = tarefas com `STARTED`, `PENDING`, `IN_PROGRESS`;
- revisao = tarefas com `REVIEW`, se o produto quiser exibir isso;
- horas por tarefa = soma dos logs daquela tarefa.

Observacao funcional:

- a listagem detalhada de tarefas por membro deve vir ja com os minutos somados;
- o front nao deve calcular o total de horas somando linhas isoladas se o backend puder devolver pronto.

Recomendacao:

- calcular os totais por requisicao;
- armazenar apenas os apontamentos de tempo brutos;
- nao armazenar contadores duplicados por membro se a tela ainda nao exigir snapshot historico.

---

## O que deve ser calculado por requisicao

Esses dados devem ser calculados em tempo real no backend:

- progresso geral do projeto;
- total de abertas;
- total de concluidas;
- total de atrasadas;
- dias restantes;
- `Project Health`;
- `Performance per member`;
- `Productivity`;
- contadores da secao `Members`;
- horas por tarefa;
- media semanal por membro.

Razao:

- sao agregacoes derivadas;
- mudam frequentemente;
- nao precisam de persistencia propria na primeira versao.

---

## O que deve ser salvo no banco

Esses dados precisam existir de forma persistida:

- logs de tempo por tarefa e membro;
- timestamps de inicio e conclusao, se forem adotados;
- snapshots agregados de periodo;
- registro do relatorio manual gerado;
- eventualmente estimativa por tarefa, se a previsao precisar melhorar.

Razao:

- sem historico persistido, o backend nao consegue reconstruir horas por semana;
- sem timestamps de ciclo de vida, a previsao de entrega fica muito imprecisa.

---

## Estrutura minima sugerida para o payload da tela

O backend pode devolver um objeto unico com blocos assim:

```json
{
  "project": {
    "id": "string",
    "title": "string",
    "stage": "STARTED",
    "deadline": "2026-08-01T00:00:00.000Z"
  },
  "summary": {
    "totalTasks": 0,
    "doneTasks": 0,
    "openTasks": 0,
    "delayedTasks": 0,
    "progress": 0
  },
  "deadline": {
    "dueDate": "2026-08-01T00:00:00.000Z",
    "daysLeft": 0
  },
  "health": {
    "status": "SAFE",
    "score": 0,
    "reason": "string"
  },
  "performancePerMember": [
    {
      "memberId": "string",
      "user": {
        "username": "string",
        "name": "string",
        "photoUrl": "string"
      },
      "weeks": [
        {
          "week": "2026-W29",
          "hours": 0
        }
      ]
    }
  ],
  "productivity": [
    {
      "memberId": "string",
      "completed": 0,
      "delayed": 0,
      "ratio": 0
    }
  ],
  "members": [
    {
      "memberId": "string",
      "user": {
        "username": "string",
        "name": "string",
        "photoUrl": "string"
      },
      "completedTasks": 0,
      "delayedTasks": 0,
      "startedTasks": 0,
      "reviewTasks": 0,
      "tasks": [
        {
          "id": "string",
          "code": "TSK-XXXXXX",
          "name": "string",
          "stage": "IN_PROGRESS",
          "spentMinutes": 0
        }
      ]
    }
  ]
}
```

Esse formato nao precisa ser exatamente igual ao final, mas ajuda a manter a tela simples e a API organizada.

---

## Prioridade de implementacao recomendada

### Fase 1

- criar o endpoint agregado da tela;
- calcular no backend todos os totais que ja existem no schema;
- usar `Task.stage` e `Project.deadline` para progressao, deadline e produtividade;
- devolver membros com contagem de tarefas.

### Fase 2

- criar a tabela de log de tempo;
- alimentar `Performance per member`;
- mostrar horas por tarefa na secao Members;
- criar snapshots por periodo;
- registrar a relacao entre snapshot, periodo e tarefas.

### Fase 3

- adicionar `started_at` e `done_at` em `Project` e `Task`;
- refinar o `Project Health` com base em ritmo real;
- implementar `POST /projects/:id/stats/report`.

---

## Resumo pratico

Se a meta for entregar a tela com o menor numero possivel de mudancas:

- usar o schema atual para todos os contadores e filtros de tarefas;
- adicionar somente uma tabela de apontamento de tempo;
- adicionar `started_at` e `done_at` em `Project` e `Task`;
- calcular quase tudo por requisicao;
- salvar no banco apenas o que representa fato historico, nao agregado.
