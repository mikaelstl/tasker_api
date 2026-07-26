```markdown
# Contexto do Projeto — Tasker

> Este documento define o contexto completo do software **Tasker** e deve ser utilizado como referência por IAs, desenvolvedores e ferramentas de geração de código. Todas as implementações, sugestões e decisões arquiteturais devem respeitar integralmente as informações aqui descritas.

---

# Visão Geral

O **Tasker** é um sistema web de gerenciamento de projetos, organizações, equipes e tarefas.

Seu principal objetivo é oferecer uma alternativa simples, moderna e intuitiva às plataformas tradicionais de gerenciamento de projetos (como Jira, ClickUp e Asana), reduzindo a complexidade dessas ferramentas e oferecendo apenas os recursos essenciais para pequenas e médias equipes.

O sistema é voltado para:

- Pequenas empresas
- Startups
- Escritórios de tecnologia
- Equipes de desenvolvimento
- Equipes acadêmicas
- Projetos individuais
- Pequenos grupos de trabalho

## Objetivos

O sistema busca fornecer:

- gerenciamento de organizações;
- gerenciamento de projetos;
- gerenciamento de equipes;
- gerenciamento de tarefas;
- gerenciamento de eventos;
- comunicação entre membros;
- geração automática de relatórios;
- monitoramento de desempenho;
- estatísticas de produtividade;
- controle automático de prazos.

---

# Filosofia do Projeto

Todo o software deve seguir os seguintes princípios:

- simplicidade acima de tudo;
- interface limpa;
- poucos cliques;
- baixa curva de aprendizagem;
- baixa carga cognitiva;
- informações objetivas;
- componentes reutilizáveis;
- automação sempre que possível;
- arquitetura modular;
- facilidade de manutenção.

Nunca adicionar funcionalidades que aumentem significativamente a complexidade da aplicação sem justificativa clara.

---

# Modelo de Negócio

Hierarquia principal do sistema:

Conta
→ Usuário
→ Organização (Workspace)
→ Projeto
→ Tarefa / Evento / Comentário

Relacionamentos:

- Uma conta pode possuir um usuário.
- Um usuário pode participar de várias organizações.
- Cada organização possui exatamente um proprietário.
- Uma organização pode possuir vários gestores.
- Uma organização pode possuir vários membros.
- Uma organização pode possuir vários projetos.
- Cada projeto pertence a apenas uma organização.
- Cada tarefa pertence a um projeto.
- Cada evento pertence a um projeto.
- Cada comentário pertence a um projeto.

---

# Papéis do Sistema

## Organizador (Owner)

Administrador máximo da organização.

Permissões:

- criar organizações;
- editar organizações;
- excluir organizações;
- adicionar membros;
- remover membros;
- promover usuários;
- rebaixar usuários;
- definir cargos;
- criar projetos;
- editar projetos;
- remover projetos;
- gerar relatórios;
- visualizar estatísticas globais.

---

## Gestor (Manager)

Responsável pela administração operacional.

Permissões:

- visualizar os projetos que gerencia ou dos quais participa;
- acompanhar equipes;
- criar eventos;
- editar eventos;
- remover eventos;
- alterar responsáveis das tarefas;
- gerar relatórios;
- visualizar estatísticas.

---

## Membro (Member)

Responsável pela execução das atividades.

Permissões:

- visualizar projetos;
- visualizar tarefas;
- atualizar apenas suas tarefas;
- criar comentários;
- visualizar calendário;
- visualizar eventos.

---

# Fluxo Geral do Sistema

1. Cadastro da conta.
2. Cadastro do usuário.
3. Login.
4. Escolha entre:
   - Criar organização;
   - Utilizar organização existente.
5. Seleção do Workspace.
6. Carregamento do Dashboard conforme o papel.
7. Criação de projetos.
8. Adição de membros.
9. Criação de tarefas.
10. Criação de eventos.
11. Comunicação via comentários.
12. Execução das tarefas.
13. Monitoramento automático.
14. Estatísticas.
15. Geração de relatórios.

---

# Dashboards

## Dashboard do Membro

Exibe:

- tarefas do dia;
- tarefas da semana;
- tarefas pendentes;
- tarefas atrasadas;
- calendário;
- datas importantes.

---

## Dashboard do Gestor

Exibe:

- indicadores do projeto;
- tarefas iniciadas;
- tarefas concluídas;
- tarefas em revisão;
- tarefas atrasadas;
- desempenho da equipe;
- seleção de projetos;
- calendário.

---

## Dashboard do Organizador

Exibe:

- visão geral da organização;
- indicadores globais;
- projetos ativos;
- notificações;
- atualizações recentes;
- atalhos administrativos;
- estatísticas gerais.

---

# Módulos do Sistema

## Contas

Responsável pelo cadastro e gerenciamento das contas.

Funcionalidades:

- cadastro;
- exclusão.

---

## Usuários

Funcionalidades:

- cadastro;
- consulta;
- listagem;
- exclusão.

---

## Organizações

Funcionalidades:

- criação;
- edição;
- exclusão.

Representam os Workspaces do sistema.

---

## Afiliações

Relacionam usuários às organizações.

Permitem:

- adicionar usuário;
- remover usuário;
- listar usuários;
- promover usuários;
- rebaixar usuários;
- definir cargos.

---

## Projetos

Responsável pelo gerenciamento completo dos projetos.

Cada projeto possui:

- nome;
- descrição;
- data de entrega;
- membros;
- tarefas;
- eventos;
- comentários.

Funcionalidades:

- criar;
- consultar;
- listar;
- editar;
- excluir.

---

## Membros do Projeto

Relacionam usuários aos projetos.

Funcionalidades:

- adicionar membro;
- listar membros;
- remover membro.

---

## Tarefas

CRUD completo.

Campos:

- título;
- descrição;
- responsável;
- prioridade;
- estágio;
- data limite;
- projeto.

Regras:

- Gestores e Organizadores podem alterar responsáveis.
- Membros somente podem atribuir tarefas para si próprios.

---

## Eventos

CRUD completo.

Campos:

- título;
- categoria;
- data;
- projeto.

Categorias:

- PENDING
- RELEASE
- MEETING
- REVIEW
- PLANNING
- TESTS
- LAUNCH

Ao criar um projeto, deve ser criado automaticamente um evento **PENDING**.

---

## Comentários

CRUD completo.

Campos:

- conteúdo;
- autor;
- data;
- projeto.

Somente membros do projeto podem comentar.

---

## Relatórios

Gerar automaticamente:

- produtividade;
- desempenho;
- tempo gasto;
- estatísticas;
- informações do projeto.

---

## Estatísticas

Calcular automaticamente:

- tarefas atribuídas;
- tarefas concluídas;
- tarefas atrasadas;
- média de conclusão;
- tempo médio;
- produtividade.

---

# Requisitos Funcionais

## RF01 — Contas

- cadastrar conta;
- excluir conta.

## RF02 — Usuários

- cadastrar usuário;
- consultar usuário;
- listar usuários;
- excluir usuário.

## RF03 — Organizações

- criar organização;
- excluir organização.

## RF04 — Afiliações

- criar vínculo;
- listar vínculos;
- excluir vínculo;
- promover usuário;
- rebaixar usuário;
- definir cargo.

## RF05 — Projetos

- criar projeto;
- consultar projeto;
- listar projetos;
- editar projeto;
- excluir projeto.

Regras de visualização:

- `OWNER` visualiza todos os projetos da organização ativa;
- `MANAGER` visualiza os projetos que gerencia ou dos quais participa;
- `MEMBER` visualiza os projetos dos quais participa.

## RF06 — Membros

- adicionar membro;
- listar membros;
- remover membro.

## RF07 — Tarefas

CRUD completo.

## RF08 — Monitoramento de Prazos

Detectar automaticamente:

- tarefas atrasadas;
- tarefas próximas do vencimento.

## RF09 — Comentários

CRUD completo.

## RF10 — Eventos

CRUD completo.

## RF11 — Relatórios

Gerar relatórios automaticamente.

## RF12 — Estatísticas

Exibir indicadores de desempenho.

## RF13 — Tipos de Eventos

- PENDING
- RELEASE
- MEETING
- REVIEW
- PLANNING
- TESTS
- LAUNCH

## RF14 — Evento Inicial

Todo projeto inicia com um evento do tipo **PENDING**.

## RF15 — Registro Automático de Tempo

Registrar automaticamente:

### Tarefas

- início;
- término;
- duração.

### Projetos

- início;
- duração total.

---

# Monitoramentos Automáticos

O sistema deve executar automaticamente:

- cálculo de estatísticas;
- cálculo de desempenho;
- atualização de dashboards;
- verificação de prazos;
- registro de tempo;
- atualização de indicadores.

---

# Requisitos Não Funcionais

## Usabilidade

- aplicação web;
- interface intuitiva;
- responsividade;
- compatibilidade com navegadores modernos;
- suporte futuro ao modo offline.

## Segurança

- autenticação JWT;
- senhas criptografadas;
- autorização baseada em papéis;
- validação de permissões;
- logout automático após cinco dias de inatividade.

## Arquitetura

Arquitetura em três camadas:

### Camada de Visualização

Frontend.

Responsável pela interface.

### Camada de Serviços

Backend REST.

Responsável por:

- regras de negócio;
- autenticação;
- permissões;
- processamento.

### Camada de Dados

Banco relacional.

Responsável pela persistência dos dados.

---

# Tecnologias

## Frontend

- React
- TypeScript
- Axios

## Backend

- NestJS
- TypeScript
- JWT

## Banco de Dados

- PostgreSQL
- Prisma ORM

---

# Diretrizes para IA

Ao gerar código, documentação ou arquitetura para este projeto, a IA deve seguir obrigatoriamente as seguintes regras:

1. Toda funcionalidade pertence a uma organização (Workspace).
2. Todo projeto pertence a uma organização.
3. Toda tarefa pertence a um projeto.
4. Todo evento pertence a um projeto.
5. Todo comentário pertence a um projeto.
6. Todas as operações sensíveis devem validar permissões.
7. Dashboards devem adaptar seu conteúdo conforme o papel do usuário.
8. Regras de negócio devem permanecer centralizadas no backend.
9. A arquitetura deve permanecer modular e de baixo acoplamento.
10. Interfaces devem manter identidade visual simples, limpa e consistente.
11. Sempre priorizar simplicidade em vez de adicionar funcionalidades desnecessárias.
12. Estatísticas e indicadores devem ser calculados automaticamente sempre que possível.
13. O sistema deve permanecer escalável, de fácil manutenção e preparado para evolução incremental.
```
