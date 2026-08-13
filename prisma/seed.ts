import {
  AuditAction,
  AuditActorType,
  AuditResource,
  EventCategory,
  OrgRole,
  PrismaClient,
  ProjectHealthStatus,
  ProjectPriority,
  ProjectStage,
  StatsPeriodType,
  TaskPriority,
  TaskStage,
} from '../generated/prisma';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const taskPriorities = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.EXTREME,
] as const;

const users = [
  { username: 'mikaelstl', name: 'Mikael', email: 'mikaelst@tasker.dev' },
  {
    username: 'bruno.santos',
    name: 'Bruno Santos',
    email: 'bruno.santos@tasker.dev',
  },
  {
    username: 'carla.lima',
    name: 'Carla Lima',
    email: 'carla.lima@tasker.dev',
  },
  {
    username: 'daniela.rocha',
    name: 'Daniela Rocha',
    email: 'daniela.rocha@tasker.dev',
  },
  {
    username: 'eduardo.martins',
    name: 'Eduardo Martins',
    email: 'eduardo.martins@tasker.dev',
  },
  {
    username: 'fernanda.alves',
    name: 'Fernanda Alves',
    email: 'fernanda.alves@tasker.dev',
  },
  {
    username: 'gabriel.costa',
    name: 'Gabriel Costa',
    email: 'gabriel.costa@tasker.dev',
  },
  {
    username: 'helena.ribeiro',
    name: 'Helena Ribeiro',
    email: 'helena.ribeiro@tasker.dev',
  },
  {
    username: 'igor.mendes',
    name: 'Igor Mendes',
    email: 'igor.mendes@tasker.dev',
  },
  {
    username: 'juliana.freitas',
    name: 'Juliana Freitas',
    email: 'juliana.freitas@tasker.dev',
  },
  {
    username: 'kleber.nunes',
    name: 'Kleber Nunes',
    email: 'kleber.nunes@tasker.dev',
  },
  {
    username: 'larissa.souza',
    name: 'Larissa Souza',
    email: 'larissa.souza@tasker.dev',
  },
  {
    username: 'marcos.vieira',
    name: 'Marcos Vieira',
    email: 'marcos.vieira@tasker.dev',
  },
  {
    username: 'natalia.gomes',
    name: 'Natália Gomes',
    email: 'natalia.gomes@tasker.dev',
  },
  {
    username: 'otavio.barbosa',
    name: 'Otávio Barbosa',
    email: 'otavio.barbosa@tasker.dev',
  },
  {
    username: 'patricia.cardoso',
    name: 'Patrícia Cardoso',
    email: 'patricia.cardoso@tasker.dev',
  },
  {
    username: 'rafael.araujo',
    name: 'Rafael Araújo',
    email: 'rafael.araujo@tasker.dev',
  },
  {
    username: 'sabrina.melo',
    name: 'Sabrina Melo',
    email: 'sabrina.melo@tasker.dev',
  },
  {
    username: 'thiago.pires',
    name: 'Thiago Pires',
    email: 'thiago.pires@tasker.dev',
  },
  {
    username: 'ursula.dias',
    name: 'Úrsula Dias',
    email: 'ursula.dias@tasker.dev',
  },
  {
    username: 'victor.sales',
    name: 'Victor Sales',
    email: 'victor.sales@tasker.dev',
  },
  {
    username: 'william.castro',
    name: 'William Castro',
    email: 'william.castro@tasker.dev',
  },
  {
    username: 'yasmin.ferreira',
    name: 'Yasmin Ferreira',
    email: 'yasmin.ferreira@tasker.dev',
  },
  {
    username: 'zeca.monteiro',
    name: 'José Monteiro',
    email: 'zeca.monteiro@tasker.dev',
  },
] as const;

const organizations = [
  {
    id: 'seed-organization-tasker',
    name: 'Tasker Tecnologia',
    code: 'TASKER',
    managers: [1, 2],
    members: [3, 4, 5, 6, 7],
    projects: [
      'Plataforma em Estado SAFE',
      'Portal em Estado WARNING',
      'Operação em Estado CRITICAL',
    ],
  },
  {
    id: 'seed-organization-atlas',
    name: 'Atlas Serviços Financeiros',
    code: 'ATLAS',
    managers: [2, 8],
    members: [4, 9, 10, 11, 12, 13],
    projects: [],
  },
  {
    id: 'seed-organization-vita',
    name: 'Vita Saúde Integrada',
    code: 'VITA',
    managers: [6, 14],
    members: [5, 10, 15, 16, 17],
    projects: [],
  },
  {
    id: 'seed-organization-nortelog',
    name: 'NorteLog Operações',
    code: 'NORTE',
    managers: [8, 18],
    members: [3, 11, 13, 19, 20, 21],
    projects: [],
  },
  {
    id: 'seed-organization-aurora',
    name: 'Aurora Comércio Digital',
    code: 'AURORA',
    managers: [14, 22],
    members: [7, 12, 16, 18, 21, 23],
    projects: [],
  },
] as const;

const taskCatalog = [
  {
    name: 'Mapear requisitos e regras de negócio',
    description:
      'Consolidar necessidades das áreas envolvidas e critérios de aceite.',
  },
  {
    name: 'Validar arquitetura da solução',
    description:
      'Revisar integrações, segurança, escalabilidade e disponibilidade.',
  },
  {
    name: 'Preparar ambientes e pipeline',
    description:
      'Automatizar build, testes, análise de qualidade e implantação.',
  },
  {
    name: 'Implementar serviço principal',
    description:
      'Desenvolver o fluxo central conforme os padrões corporativos.',
  },
  {
    name: 'Integrar sistemas legados',
    description:
      'Disponibilizar contratos resilientes para troca de dados corporativos.',
  },
  {
    name: 'Construir experiência do usuário',
    description: 'Implementar jornadas validadas com as áreas de negócio e UX.',
  },
  {
    name: 'Aplicar controles de segurança',
    description:
      'Configurar autenticação, autorização, auditoria e proteção de dados.',
  },
  {
    name: 'Executar testes integrados',
    description:
      'Validar cenários funcionais, falhas, desempenho e recuperação.',
  },
  {
    name: 'Homologar com usuários-chave',
    description:
      'Conduzir aceite assistido e registrar ajustes de homologação.',
  },
  {
    name: 'Planejar entrada em produção',
    description:
      'Definir implantação, comunicação, suporte e plano de reversão.',
  },
] as const;

const eventCatalog = [
  {
    title: 'Planejamento executivo',
    category: EventCategory.PLANNING,
  },
  {
    title: 'Revisão de entrega',
    category: EventCategory.REVIEW,
  },
  {
    title: 'Comitê de acompanhamento',
    category: EventCategory.MEETING,
  },
  {
    title: 'Janela de testes integrados',
    category: EventCategory.TESTS,
  },
] as const;

const commentCatalog = [
  'Escopo revisado com as áreas responsáveis e riscos registrados.',
  'Dependências externas confirmadas para a próxima janela de entrega.',
  'Indicadores atualizados após a reunião semanal de acompanhamento.',
  'Equipe alinhada sobre os critérios de aceite e plano de homologação.',
  'Ponto de atenção registrado para capacidade e prazo de integração.',
] as const;

// Os offsets abaixo são relativos a SEED_TODAY ("hoje" no momento do seed) e
// foram calibrados para que `StatsService.calculateHealth` — que compara as
// datas com o fim do mês corrente (`period.end`, de 1 a 31 dias à frente de
// hoje, dependendo do dia em que o seed for executado) — sempre produza o
// status configurado em `healthStatus`, não importa em que dia do mês o seed
// rode:
// - SAFE e WARNING usam `deadlineOffset` > 31 dias para nunca ficarem
//   "overdue" (deadline no passado em relação a `period.end`).
// - CRITICAL usa `deadlineOffset` negativo para estar sempre vencido.
// - A proporção de tarefas com `delayed = true` controla o score de forma
//   estável (independe da hora exata da consulta).
const projectScenarios = [
  {
    healthStatus: ProjectHealthStatus.SAFE,
    healthScore: 97,
    stage: ProjectStage.IN_PROGRESS,
    priority: ProjectPriority.HIGH,
    deadlineOffset: 50,
    startedOffset: -30,
    taskStages: [
      TaskStage.DONE,
      TaskStage.DONE,
      TaskStage.DONE,
      TaskStage.DONE,
      TaskStage.DONE,
      TaskStage.STARTED,
    ],
    taskDeadlineOffsets: [-20, -18, -16, -14, -10, 40],
  },
  {
    healthStatus: ProjectHealthStatus.WARNING,
    healthScore: 54,
    stage: ProjectStage.IN_PROGRESS,
    priority: ProjectPriority.MEDIUM,
    deadlineOffset: 90,
    startedOffset: -20,
    taskStages: [
      TaskStage.DONE,
      TaskStage.DONE,
      TaskStage.DONE,
      TaskStage.STARTED,
      TaskStage.STARTED,
      TaskStage.PENDING,
      TaskStage.PENDING,
      TaskStage.PENDING,
    ],
    taskDeadlineOffsets: [-25, -20, -15, -5, 55, -3, -1, 58],
  },
  {
    healthStatus: ProjectHealthStatus.CRITICAL,
    healthScore: 18,
    stage: ProjectStage.PAUSED,
    priority: ProjectPriority.EXTREME,
    deadlineOffset: -10,
    startedOffset: -50,
    taskStages: [
      TaskStage.DONE,
      TaskStage.STARTED,
      TaskStage.STARTED,
      TaskStage.PENDING,
      TaskStage.PENDING,
      TaskStage.PENDING,
      TaskStage.PENDING,
      TaskStage.PENDING,
      TaskStage.PENDING,
      TaskStage.PENDING,
    ],
    taskDeadlineOffsets: [-43, -38, -33, -28, -23, -18, -15, -13, -11, -10],
  },
] as const;

function projectScenario(projectIndex: number) {
  const scenario = projectScenarios[projectIndex];

  if (!scenario) {
    throw new Error(
      `Cenário de projeto não configurado para o índice ${projectIndex}.`,
    );
  }

  return scenario;
}

function accountId(index: number) {
  return `seed-account-${String(index + 1).padStart(2, '0')}`;
}

function affiliationId(orgCode: string, username: string) {
  return `seed-affiliation-${orgCode.toLowerCase()}-${username}`;
}

function projectId(orgCode: string, projectIndex: number) {
  return `seed-project-${orgCode.toLowerCase()}-${String(projectIndex + 1).padStart(2, '0')}`;
}

function memberId(projectKey: string, username: string) {
  return `seed-member-${projectKey}-${username}`;
}

function taskId(projectKey: string, taskIndex: number) {
  return `seed-task-${projectKey}-${String(taskIndex + 1).padStart(2, '0')}`;
}

// Âncora dinâmica: "hoje" no momento em que o seed é executado. As datas de
// projetos e tarefas são todas relativas a este ponto para que os cenários de
// saúde (SAFE/WARNING/CRITICAL) calculados ao vivo por `StatsService` continuem
// corretos independentemente de quando o seed for rodado.
const SEED_TODAY = (() => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
})();

function utcDate(dayOffset: number, hour = 12) {
  const date = new Date(SEED_TODAY);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour);
  return date;
}

// Retorna uma data dentro do mês "monthsAgo" meses atrás de SEED_TODAY (0 =
// mês corrente). Usado para distribuir tarefas/apontamentos em meses-calendário
// reais (em vez de offsets em dias), já que `StatsService.resolveMonth` filtra
// por mês-calendário UTC. `setUTCDate(1)` antes de mexer no mês evita estouro
// de dia (ex.: dia 31 "vazando" para o mês seguinte ao subtrair meses).
function monthDate(monthsAgo: number, day: number, hour = 12) {
  const date = new Date(SEED_TODAY);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - monthsAgo);
  date.setUTCDate(day);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function organizationCreatedAt(orgIndex: number) {
  return utcDate(-130 + orgIndex * 4, 8);
}

function projectCreatedAt(orgIndex: number, projectIndex: number) {
  return utcDate(-100 + orgIndex * 4 + projectIndex * 3, 8);
}

function taskCreatedAt(
  orgIndex: number,
  projectIndex: number,
  taskIndex: number,
) {
  return utcDate(-75 + orgIndex * 4 + projectIndex * 3 + taskIndex, 10);
}

function organizationUserIndexes(organization: (typeof organizations)[number]) {
  return [0, ...organization.managers, ...organization.members];
}

type TaskPlan = {
  index: number;
  code: string;
  name: string;
  description: string;
  stage: TaskStage;
  priority: TaskPriority;
  ownerUsername: string;
  createdAt: Date;
  startedAt: Date | null;
  doneAt: Date | null;
  deadline: Date;
  delayed: boolean;
};

// Reconstrói, como dados puros (sem tocar o banco), as tarefas "originais" de
// cada cenário de projeto — mesma matemática de datas já calibrada para os
// status de saúde SAFE/WARNING/CRITICAL (ver comentário de `projectScenarios`).
function buildScenarioTaskPlans(
  scenario: (typeof projectScenarios)[number],
  organizationUsers: readonly number[],
  orgIndex: number,
  projectIndex: number,
): TaskPlan[] {
  return taskCatalog
    .slice(0, scenario.taskStages.length)
    .map((taskTemplate, taskIndex) => {
      const stage = scenario.taskStages[taskIndex];
      const priority =
        taskPriorities[
          (taskIndex + projectIndex * 2 + orgIndex) % taskPriorities.length
        ];
      const ownerUser =
        users[
          organizationUsers[
            (taskIndex + projectIndex) % organizationUsers.length
          ]
        ];
      const startedAt =
        stage === TaskStage.PENDING
          ? null
          : utcDate(-35 + projectIndex * 3 + taskIndex, 9);
      const doneAt =
        stage === TaskStage.DONE
          ? utcDate(-12 + projectIndex * 2 + taskIndex, 18)
          : null;
      const deadline = utcDate(scenario.taskDeadlineOffsets[taskIndex], 23);
      const createdAt = taskCreatedAt(orgIndex, projectIndex, taskIndex);
      const delayed =
        stage !== TaskStage.DONE && deadline.getTime() < utcDate(0).getTime();

      return {
        index: taskIndex,
        code: `TSK-${String(taskIndex + 1).padStart(3, '0')}`,
        name: taskTemplate.name,
        description: taskTemplate.description,
        stage,
        priority,
        ownerUsername: ownerUser.username,
        createdAt,
        startedAt,
        doneAt,
        deadline,
        delayed,
      };
    });
}

type ExtraTaskStageSlot = {
  stage: TaskStage;
  monthsAgo: number;
  delayed: boolean;
};

// Define, por status de saúde, a distribuição de estágio das 16 tarefas extras
// (2 por membro, considerando os 8 participantes da organização Tasker) de
// forma a preservar aproximadamente a mesma proporção concluída/atrasada das
// tarefas originais do cenário — assim a saúde recalculada ao vivo por
// `StatsService.calculateHealth` continua batendo com `scenario.healthStatus`
// mesmo depois de adicionar bastante tarefa nova. Ver seção "3.2 Extra tasks
// e cálculo de saúde" no PR/discussão original para os números.
function extraTaskStagePlan(
  healthStatus: (typeof projectScenarios)[number]['healthStatus'],
): ExtraTaskStageSlot[] {
  const openStages = [
    TaskStage.STARTED,
    TaskStage.PENDING,
    TaskStage.REVIEW,
  ] as const;

  if (healthStatus === ProjectHealthStatus.SAFE) {
    // Mantém a proporção concluída alta (~83%) e nenhuma tarefa atrasada.
    return [
      ...Array.from({ length: 13 }, (_, i) => ({
        stage: TaskStage.DONE,
        monthsAgo: i % 3,
        delayed: false,
      })),
      ...Array.from({ length: 3 }, () => ({
        stage: TaskStage.STARTED,
        monthsAgo: 0,
        delayed: false,
      })),
    ];
  }

  if (healthStatus === ProjectHealthStatus.WARNING) {
    // Mantém doneTasks/total e delayedTasks/total em ~37.5%, igual ao cenário
    // original (3 de 8), então o score de saúde recalculado não muda.
    return [
      ...Array.from({ length: 6 }, (_, i) => ({
        stage: TaskStage.DONE,
        monthsAgo: i % 3,
        delayed: false,
      })),
      ...Array.from({ length: 6 }, (_, i) => ({
        stage: openStages[i % openStages.length],
        monthsAgo: 0,
        delayed: true,
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        stage: openStages[i % 2],
        monthsAgo: 0,
        delayed: false,
      })),
    ];
  }

  // CRITICAL: mantém a maioria das tarefas abertas e atrasadas; o status
  // permanece CRITICAL de qualquer forma porque o prazo do projeto já está
  // vencido (`overdue`), mas preservar a proporção mantém o score condizente.
  return [
    ...Array.from({ length: 2 }, (_, i) => ({
      stage: TaskStage.DONE,
      monthsAgo: i,
      delayed: false,
    })),
    ...Array.from({ length: 13 }, (_, i) => ({
      stage: openStages[i % openStages.length],
      monthsAgo: 0,
      delayed: true,
    })),
    {
      stage: TaskStage.PENDING,
      monthsAgo: 0,
      delayed: false,
    },
  ];
}

// Gera 16 tarefas extras por projeto (2 por membro da organização Tasker),
// com estágios variados e concluídas/iniciadas em meses-calendário diferentes
// (mês corrente, mês anterior e retrasado) para que os endpoints de stats por
// mês (`/stats`, `/stats/members`, `/stats/members/performance`) tragam dados
// diferentes conforme o mês selecionado no frontend.
function buildExtraTaskPlans(
  scenario: (typeof projectScenarios)[number],
  organizationUsers: readonly number[],
  startIndex: number,
  orgIndex: number,
  projectIndex: number,
): TaskPlan[] {
  const stagePlan = extraTaskStagePlan(scenario.healthStatus);

  return stagePlan.map((entry, offset) => {
    const index = startIndex + offset;
    const catalogEntry = taskCatalog[index % taskCatalog.length];
    const ownerUser =
      users[organizationUsers[offset % organizationUsers.length]];
    const priority =
      taskPriorities[
        (index + projectIndex * 2 + orgIndex) % taskPriorities.length
      ];

    let createdAt: Date;
    let startedAt: Date | null = null;
    let doneAt: Date | null = null;
    let deadline: Date;

    if (entry.stage === TaskStage.DONE) {
      createdAt = monthDate(entry.monthsAgo, 3, 9);
      startedAt = monthDate(entry.monthsAgo, 8, 9);
      doneAt = monthDate(entry.monthsAgo, 20, 18);
      deadline = monthDate(Math.max(entry.monthsAgo - 1, 0), 25, 23);
    } else if (entry.stage === TaskStage.PENDING) {
      createdAt = monthDate(entry.monthsAgo, 2, 9);
      deadline = entry.delayed
        ? utcDate(-5 - (offset % 15), 23)
        : utcDate(20 + (offset % 30), 23);
    } else {
      createdAt = monthDate(entry.monthsAgo, 2, 9);
      startedAt = monthDate(entry.monthsAgo, 6, 9);
      deadline = entry.delayed
        ? utcDate(-3 - (offset % 15), 23)
        : utcDate(25 + (offset % 30), 23);
    }

    const delayed =
      entry.stage !== TaskStage.DONE &&
      deadline.getTime() < utcDate(0).getTime();

    return {
      index,
      code: `TSK-${String(index + 1).padStart(3, '0')}`,
      name: catalogEntry.name,
      description: catalogEntry.description,
      stage: entry.stage,
      priority,
      ownerUsername: ownerUser.username,
      createdAt,
      startedAt,
      doneAt,
      deadline,
      delayed,
    };
  });
}

function validateSeedConfiguration() {
  if (users.length !== 24) {
    throw new Error('O seed deve possuir exatamente 24 usuários.');
  }

  if (users[0].username !== 'mikaelstl') {
    throw new Error('mikaelstl deve ser o owner das organizações.');
  }

  if (
    new Set(users.map((user) => user.username)).size !== users.length ||
    new Set(users.map((user) => user.email)).size !== users.length
  ) {
    throw new Error('Username e e-mail devem ser únicos no seed.');
  }

  if (users.some((user) => !user.email.endsWith('@tasker.dev'))) {
    throw new Error('Todos os e-mails devem usar o domínio @tasker.dev.');
  }

  if (organizations.length !== 5) {
    throw new Error('O seed deve possuir exatamente 5 organizações.');
  }

  for (const organization of organizations) {
    const participantCount = organizationUserIndexes(organization).length;

    if (organization.managers.length < 2) {
      throw new Error(`${organization.name} deve possuir ao menos 2 managers.`);
    }

    if (participantCount < 6 || participantCount > 10) {
      throw new Error(
        `${organization.name} deve possuir entre 6 e 10 participantes.`,
      );
    }

    if (organization.projects.length > 3) {
      throw new Error(
        `${organization.name} não pode possuir mais de 3 projetos.`,
      );
    }
  }

  const totalProjects = organizations.reduce(
    (total, organization) => total + organization.projects.length,
    0,
  );

  if (totalProjects !== 3) {
    throw new Error('O seed deve possuir exatamente 3 projetos.');
  }

  if (projectScenarios.length !== totalProjects) {
    throw new Error(
      'Cada projeto deve possuir um cenário de saúde configurado.',
    );
  }
}

async function clearSeedProjects() {
  const projectFilter = { startsWith: 'seed-project-' };

  await prisma.auditLog.deleteMany({ where: { resourcekey: projectFilter } });
  await prisma.taskWorkLog.deleteMany({ where: { projectkey: projectFilter } });
  await prisma.comment.deleteMany({ where: { projectkey: projectFilter } });
  await prisma.event.deleteMany({ where: { projectkey: projectFilter } });
  await prisma.task.deleteMany({ where: { projectkey: projectFilter } });
  await prisma.member.deleteMany({ where: { projectkey: projectFilter } });
  await prisma.projectStatsReport.deleteMany({
    where: { projectkey: projectFilter },
  });
  await prisma.projectStatsPeriodSnapshot.deleteMany({
    where: { projectkey: projectFilter },
  });
  await prisma.project.deleteMany({ where: { id: projectFilter } });
}

async function seedAccountsAndUsers() {
  for (const [index, user] of users.entries()) {
    const id = accountId(index);
    const plainPassword = `Demo@${String(index + 1).padStart(2, '0')}`;
    const password = await hash(plainPassword, 10);

    await prisma.account.upsert({
      where: { id },
      update: { email: user.email, password },
      create: { id, email: user.email, password },
    });

    await prisma.user.upsert({
      where: { accountkey: id },
      update: { username: user.username, name: user.name },
      create: {
        username: user.username,
        name: user.name,
        accountkey: id,
      },
    });
  }
}

async function seedOrganizationsAndAffiliations() {
  for (const [orgIndex, organization] of organizations.entries()) {
    await prisma.organization.upsert({
      where: { id: organization.id },
      update: {
        name: organization.name,
        ownerkey: users[0].username,
        created_at: organizationCreatedAt(orgIndex),
      },
      create: {
        id: organization.id,
        name: organization.name,
        ownerkey: users[0].username,
        created_at: organizationCreatedAt(orgIndex),
      },
    });

    for (const userIndex of organizationUserIndexes(organization)) {
      const user = users[userIndex];
      const role = userIndex === 0 ? OrgRole.OWNER : OrgRole.MEMBER;
      const isManager = (organization.managers as readonly number[]).includes(
        userIndex,
      );
      const affiliationRole = isManager ? OrgRole.MANAGER : role;
      const id = affiliationId(organization.code, user.username);

      await prisma.affiliation.upsert({
        where: { id },
        update: {
          orgkey: organization.id,
          userkey: user.username,
          role: affiliationRole,
          created_at: organizationCreatedAt(orgIndex),
        },
        create: {
          id,
          orgkey: organization.id,
          userkey: user.username,
          role: affiliationRole,
          created_at: organizationCreatedAt(orgIndex),
        },
      });
    }
  }
}

async function seedProjectsAndMembers() {
  for (const [orgIndex, organization] of organizations.entries()) {
    const organizationUsers = organizationUserIndexes(organization);

    for (const [projectIndex, title] of organization.projects.entries()) {
      const scenario = projectScenario(projectIndex);
      const id = projectId(organization.code, projectIndex);
      const stage = scenario.stage;
      const priority = scenario.priority;
      const managerIndex =
        organization.managers[projectIndex % organization.managers.length];
      const manager = users[managerIndex];
      const startedAt = utcDate(scenario.startedOffset, 9);
      const doneAt = null;
      const deadline = utcDate(scenario.deadlineOffset, 23);
      const createdAt = projectCreatedAt(orgIndex, projectIndex);
      const delayed = deadline.getTime() < utcDate(0).getTime();

      await prisma.project.upsert({
        where: { id },
        update: {
          title,
          description: `${title}: iniciativa estratégica da ${organization.name} para melhoria de eficiência, experiência e governança.`,
          deadline,
          started_at: startedAt,
          done_at: doneAt,
          delayed,
          stage,
          priority,
          orgkey: organization.id,
          managerkey: affiliationId(organization.code, manager.username),
          created_at: createdAt,
        },
        create: {
          id,
          title,
          description: `${title}: iniciativa estratégica da ${organization.name} para melhoria de eficiência, experiência e governança.`,
          deadline,
          started_at: startedAt,
          done_at: doneAt,
          delayed,
          stage,
          priority,
          orgkey: organization.id,
          managerkey: affiliationId(organization.code, manager.username),
          created_at: createdAt,
        },
      });

      for (const userIndex of organizationUsers) {
        const user = users[userIndex];
        const idMember = memberId(id, user.username);

        await prisma.member.upsert({
          where: { id: idMember },
          update: {
            projectkey: id,
            userkey: affiliationId(organization.code, user.username),
            created_at: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
          },
          create: {
            id: idMember,
            projectkey: id,
            userkey: affiliationId(organization.code, user.username),
            created_at: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }
}

async function seedTasks(): Promise<Map<string, TaskPlan[]>> {
  const taskPlansByProject = new Map<string, TaskPlan[]>();

  for (const [orgIndex, organization] of organizations.entries()) {
    const organizationUsers = organizationUserIndexes(organization);

    for (const [projectIndex] of organization.projects.entries()) {
      const scenario = projectScenario(projectIndex);
      const projectKey = projectId(organization.code, projectIndex);
      const plans = [
        ...buildScenarioTaskPlans(
          scenario,
          organizationUsers,
          orgIndex,
          projectIndex,
        ),
        ...buildExtraTaskPlans(
          scenario,
          organizationUsers,
          scenario.taskStages.length,
          orgIndex,
          projectIndex,
        ),
      ];

      taskPlansByProject.set(projectKey, plans);

      for (const plan of plans) {
        const id = taskId(projectKey, plan.index);
        const data = {
          code: plan.code,
          name: plan.name,
          description: plan.description,
          deadline: plan.deadline,
          started_at: plan.startedAt,
          done_at: plan.doneAt,
          delayed: plan.delayed,
          stage: plan.stage,
          priority: plan.priority,
          projectkey: projectKey,
          ownerkey: memberId(projectKey, plan.ownerUsername),
          created_at: plan.createdAt,
        };

        await prisma.task.upsert({
          where: { id },
          update: data,
          create: { id, ...data },
        });
      }
    }
  }

  return taskPlansByProject;
}

async function seedCommentsAndEvents() {
  for (const [orgIndex, organization] of organizations.entries()) {
    const organizationUsers = organizationUserIndexes(organization);

    for (const [projectIndex] of organization.projects.entries()) {
      const projectKey = projectId(organization.code, projectIndex);

      for (const [commentIndex, content] of commentCatalog.entries()) {
        const owner =
          users[
            organizationUsers[
              (commentIndex + projectIndex) % organizationUsers.length
            ]
          ];
        const id = `seed-comment-${projectKey}-${commentIndex + 1}`;
        const data = {
          content,
          date: utcDate(
            -18 + orgIndex * 2 + projectIndex + commentIndex,
            10 + commentIndex,
          ),
          created_at: utcDate(
            -19 + orgIndex * 2 + projectIndex + commentIndex,
            10 + commentIndex,
          ),
          ownerkey: memberId(projectKey, owner.username),
          projectkey: projectKey,
        };

        await prisma.comment.upsert({
          where: { id },
          update: data,
          create: { id, ...data },
        });
      }

      for (const [eventIndex, eventTemplate] of eventCatalog.entries()) {
        const id = `seed-event-${projectKey}-${eventIndex + 1}`;
        const data = {
          title: `${eventTemplate.title} — ${organization.projects[projectIndex]}`,
          date: utcDate(
            5 + orgIndex * 4 + projectIndex * 6 + eventIndex * 3,
            9 + eventIndex * 2,
          ),
          category: eventTemplate.category,
          created_at: utcDate(
            3 + orgIndex * 4 + projectIndex * 6 + eventIndex * 3,
            9 + eventIndex * 2,
          ),
          projectkey: projectKey,
        };

        await prisma.event.upsert({
          where: { id },
          update: data,
          create: { id, ...data },
        });
      }
    }
  }
}

// Gera um apontamento de trabalho por tarefa iniciada (STARTED/REVIEW/DONE).
// Tarefas concluídas registram o apontamento na data de conclusão (mês em que
// a tarefa foi de fato feita); tarefas em andamento registram nos últimos
// dias (mês corrente). Isso espalha `TaskWorkLog.logged_at` pelos mesmos
// meses-calendário usados em `buildExtraTaskPlans`, para que
// `ProjectStats.performancePerMember` (horas/semana) varie de fato conforme o
// mês selecionado no frontend.
async function seedWorkLogs(taskPlansByProject: Map<string, TaskPlan[]>) {
  for (const [orgIndex, organization] of organizations.entries()) {
    for (const [projectIndex] of organization.projects.entries()) {
      const projectKey = projectId(organization.code, projectIndex);
      const plans = taskPlansByProject.get(projectKey) ?? [];
      let logIndex = 0;

      for (const plan of plans) {
        if (!plan.startedAt) {
          continue;
        }

        const loggedAt = plan.doneAt ?? utcDate(-1 - (logIndex % 5), 17);
        const id = `seed-worklog-${projectKey}-${String(logIndex + 1).padStart(2, '0')}`;
        const data = {
          projectkey: projectKey,
          taskkey: taskId(projectKey, plan.index),
          memberkey: memberId(projectKey, plan.ownerUsername),
          minutes: 90 + ((plan.index + projectIndex + orgIndex) % 7) * 45,
          logged_at: loggedAt,
          note: `Atividades executadas em ${plan.name.toLowerCase()}.`,
          source: 'ENTERPRISE_SEED',
          created_at: new Date(loggedAt.getTime() - 60 * 60 * 1000),
        };

        await prisma.taskWorkLog.upsert({
          where: { id },
          update: data,
          create: { id, ...data },
        });

        logIndex += 1;
      }
    }
  }
}

async function seedProjectStats() {
  for (const [orgIndex, organization] of organizations.entries()) {
    const organizationUsers = organizationUserIndexes(organization);

    for (const [projectIndex] of organization.projects.entries()) {
      const scenario = projectScenario(projectIndex);
      const projectKey = projectId(organization.code, projectIndex);
      const healthStatus = scenario.healthStatus;
      const healthScore = scenario.healthScore;
      const doneTasks = scenario.taskStages.filter(
        (stage) => stage === TaskStage.DONE,
      ).length;
      const id = `seed-snapshot-${projectKey}`;
      const performance = organizationUsers
        .slice(0, 5)
        .map((userIndex, index) => ({
          username: users[userIndex].username,
          completed_tasks: 2 + ((projectIndex + index) % 6),
          spent_minutes: 360 + ((orgIndex + projectIndex + index) % 8) * 90,
        }));
      const data = {
        projectkey: projectKey,
        period_type: StatsPeriodType.MONTH,
        period_start: new Date('2026-07-01T00:00:00.000Z'),
        period_end: new Date('2026-07-31T23:59:59.000Z'),
        generated_at: new Date('2026-07-23T20:00:00.000Z'),
        cutoff_at: new Date('2026-07-23T19:59:59.000Z'),
        created_at: new Date('2026-07-23T19:00:00.000Z'),
        performance_per_member_json: performance,
        productivity_json: {
          completed_tasks: doneTasks,
          average_cycle_days: 3.2 + ((orgIndex + projectIndex) % 5) * 0.7,
          logged_hours: 48 + ((orgIndex * 8 + projectIndex * 3) % 52),
        },
        summary_json: {
          active_members: organizationUsers.length,
          completion_percentage: Math.round(
            (doneTasks / scenario.taskStages.length) * 100,
          ),
          open_risks:
            healthStatus === ProjectHealthStatus.SAFE
              ? 0
              : healthStatus === ProjectHealthStatus.WARNING
                ? 2
                : 5,
        },
        health_status: healthStatus,
        health_score: healthScore,
      };

      await prisma.projectStatsPeriodSnapshot.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
    }
  }
}

async function seedAuditLogs() {
  for (const [orgIndex, organization] of organizations.entries()) {
    const organizationAuditId = `seed-audit-${organization.code.toLowerCase()}-organization`;
    const organizationData = {
      orgkey: organization.id,
      actorkey: users[0].username,
      actorType: AuditActorType.USER,
      action: AuditAction.CREATE,
      resource: AuditResource.ORGS,
      resourcekey: organization.id,
      changes: {
        name: organization.name,
        owner: users[0].username,
      },
      created_at: new Date('2026-06-15T12:00:00.000Z'),
    };

    await prisma.auditLog.upsert({
      where: { id: organizationAuditId },
      update: organizationData,
      create: { id: organizationAuditId, ...organizationData },
    });

    for (const [projectIndex, title] of organization.projects.entries()) {
      const id = `seed-audit-${organization.code.toLowerCase()}-project-${projectIndex + 1}`;
      const managerIndex =
        organization.managers[projectIndex % organization.managers.length];
      const data = {
        orgkey: organization.id,
        actorkey: users[managerIndex].username,
        actorType: AuditActorType.USER,
        action: AuditAction.CREATE,
        resource: AuditResource.PROJECTS,
        resourcekey: projectId(organization.code, projectIndex),
        changes: { title },
        created_at: projectCreatedAt(orgIndex, projectIndex),
      };

      await prisma.auditLog.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
    }
  }
}

async function main() {
  validateSeedConfiguration();
  await seedAccountsAndUsers();
  await seedOrganizationsAndAffiliations();
  await clearSeedProjects();
  await seedProjectsAndMembers();
  const taskPlansByProject = await seedTasks();
  await seedCommentsAndEvents();
  await seedWorkLogs(taskPlansByProject);
  await seedProjectStats();
  await seedAuditLogs();

  console.info('Seed empresarial concluído com sucesso.');
  console.info(
    '24 usuários, 5 organizações e 3 projetos, com tarefas distribuídas por todos os membros em múltiplos meses.',
  );
  console.info('Owner de todas as organizações: mikaelstl / Demo@01');
  console.info('Demais senhas seguem a sequência Demo@02 até Demo@24.');
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao executar o seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
