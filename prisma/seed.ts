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

const projectStages = [
  ProjectStage.STARTED,
  ProjectStage.PENDING,
  ProjectStage.IN_PROGRESS,
  ProjectStage.PAUSED,
  ProjectStage.COMPLETED,
] as const;

const projectPriorities = [
  ProjectPriority.LOW,
  ProjectPriority.MEDIUM,
  ProjectPriority.HIGH,
  ProjectPriority.EXTREME,
] as const;

const taskStages = [
  TaskStage.STARTED,
  TaskStage.PENDING,
  TaskStage.IN_PROGRESS,
  TaskStage.REVIEW,
  TaskStage.DONE,
] as const;

const taskPriorities = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.EXTREME,
] as const;

const healthStatuses = [
  ProjectHealthStatus.SAFE,
  ProjectHealthStatus.WARNING,
  ProjectHealthStatus.CRITICAL,
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
      'Modernização da Plataforma',
      'Portal Corporativo',
      'Automação de Atendimento',
      'Observabilidade e SRE',
      'Gestão de Identidades',
      'Data Lake Operacional',
      'Aplicativo de Colaboradores',
      'Programa de Segurança',
    ],
  },
  {
    id: 'seed-organization-atlas',
    name: 'Atlas Serviços Financeiros',
    code: 'ATLAS',
    managers: [2, 8],
    members: [4, 9, 10, 11, 12, 13],
    projects: [
      'Open Finance',
      'Motor Antifraude',
      'Onboarding Digital',
      'Conciliação Financeira',
      'Crédito para Empresas',
      'Adequação Regulatória',
      'Cobrança Inteligente',
      'Painel Executivo',
    ],
  },
  {
    id: 'seed-organization-vita',
    name: 'Vita Saúde Integrada',
    code: 'VITA',
    managers: [6, 14],
    members: [5, 10, 15, 16, 17],
    projects: [
      'Prontuário Integrado',
      'Telemedicina',
      'Agendamento Omnichannel',
      'Jornada do Paciente',
      'Gestão de Leitos',
      'Interoperabilidade Clínica',
      'Farmácia Digital',
      'Indicadores Assistenciais',
    ],
  },
  {
    id: 'seed-organization-nortelog',
    name: 'NorteLog Operações',
    code: 'NORTE',
    managers: [8, 18],
    members: [3, 11, 13, 19, 20, 21],
    projects: [
      'Torre de Controle Logística',
      'Roteirização Inteligente',
      'Gestão de Frota',
      'Portal de Transportadoras',
      'Rastreamento em Tempo Real',
      'Otimização de Armazéns',
      'Previsão de Demanda',
      'Logística Reversa',
    ],
  },
  {
    id: 'seed-organization-aurora',
    name: 'Aurora Comércio Digital',
    code: 'AURORA',
    managers: [14, 22],
    members: [7, 12, 16, 18, 21, 23],
    projects: [
      'Marketplace B2B',
      'Clube de Fidelidade',
      'Experiência Omnichannel',
      'Recomendação de Produtos',
      'Gestão de Catálogo',
      'Checkout Unificado',
      'Campanhas Personalizadas',
      'Expansão Regional',
    ],
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

function utcDate(dayOffset: number, hour = 12) {
  const date = new Date('2026-07-01T00:00:00.000Z');
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour);
  return date;
}

function organizationUserIndexes(organization: (typeof organizations)[number]) {
  return [0, ...organization.managers, ...organization.members];
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

    if (organization.projects.length !== 8) {
      throw new Error(
        `${organization.name} deve possuir exatamente 8 projetos.`,
      );
    }
  }

  if (taskCatalog.length < 10) {
    throw new Error('Cada projeto deve possuir ao menos 10 tarefas.');
  }
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
  for (const organization of organizations) {
    await prisma.organization.upsert({
      where: { id: organization.id },
      update: {
        name: organization.name,
        ownerkey: users[0].username,
      },
      create: {
        id: organization.id,
        name: organization.name,
        ownerkey: users[0].username,
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
        },
        create: {
          id,
          orgkey: organization.id,
          userkey: user.username,
          role: affiliationRole,
        },
      });
    }
  }
}

async function seedProjectsAndMembers() {
  for (const [orgIndex, organization] of organizations.entries()) {
    const organizationUsers = organizationUserIndexes(organization);

    for (const [projectIndex, title] of organization.projects.entries()) {
      const id = projectId(organization.code, projectIndex);
      const stage =
        projectStages[(projectIndex + orgIndex) % projectStages.length];
      const priority =
        projectPriorities[
          (projectIndex + orgIndex * 2) % projectPriorities.length
        ];
      const managerIndex =
        organization.managers[projectIndex % organization.managers.length];
      const manager = users[managerIndex];
      const startedAt =
        stage === ProjectStage.PENDING
          ? null
          : utcDate(-60 + orgIndex * 4 + projectIndex * 3, 9);
      const doneAt =
        stage === ProjectStage.COMPLETED
          ? utcDate(-8 + orgIndex + projectIndex, 18)
          : null;
      const deadline = utcDate(-18 + orgIndex * 12 + projectIndex * 13, 23);
      const delayed =
        stage !== ProjectStage.COMPLETED &&
        deadline.getTime() < utcDate(22).getTime();

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
          },
          create: {
            id: idMember,
            projectkey: id,
            userkey: affiliationId(organization.code, user.username),
          },
        });
      }
    }
  }
}

async function seedTasks() {
  for (const [orgIndex, organization] of organizations.entries()) {
    const organizationUsers = organizationUserIndexes(organization);

    for (const [projectIndex] of organization.projects.entries()) {
      const projectKey = projectId(organization.code, projectIndex);

      for (const [taskIndex, taskTemplate] of taskCatalog.entries()) {
        const id = taskId(projectKey, taskIndex);
        const stage =
          taskStages[(taskIndex + projectIndex + orgIndex) % taskStages.length];
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
        const deadline = utcDate(
          -10 + orgIndex * 9 + projectIndex * 7 + taskIndex * 3,
          23,
        );
        const delayed =
          stage !== TaskStage.DONE &&
          deadline.getTime() < utcDate(22).getTime();

        await prisma.task.upsert({
          where: { id },
          update: {
            code: `${organization.code.slice(0, 3)}-${String(taskIndex + 1).padStart(3, '0')}`,
            name: taskTemplate.name,
            description: taskTemplate.description,
            deadline,
            started_at: startedAt,
            done_at: doneAt,
            delayed,
            stage,
            priority,
            projectkey: projectKey,
            ownerkey: memberId(projectKey, ownerUser.username),
          },
          create: {
            id,
            code: `${organization.code.slice(0, 3)}-${String(taskIndex + 1).padStart(3, '0')}`,
            name: taskTemplate.name,
            description: taskTemplate.description,
            deadline,
            started_at: startedAt,
            done_at: doneAt,
            delayed,
            stage,
            priority,
            projectkey: projectKey,
            ownerkey: memberId(projectKey, ownerUser.username),
          },
        });
      }
    }
  }
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
          ownerkey: owner.username,
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

async function seedWorkLogs() {
  for (const [orgIndex, organization] of organizations.entries()) {
    const organizationUsers = organizationUserIndexes(organization);

    for (const [projectIndex] of organization.projects.entries()) {
      const projectKey = projectId(organization.code, projectIndex);

      for (let taskIndex = 0; taskIndex < 6; taskIndex += 1) {
        const memberUser =
          users[
            organizationUsers[
              (taskIndex + projectIndex) % organizationUsers.length
            ]
          ];
        const id = `seed-worklog-${projectKey}-${taskIndex + 1}`;
        const data = {
          projectkey: projectKey,
          taskkey: taskId(projectKey, taskIndex),
          memberkey: memberId(projectKey, memberUser.username),
          minutes: 90 + ((taskIndex + projectIndex + orgIndex) % 7) * 45,
          logged_at: utcDate(-15 + orgIndex + projectIndex + taskIndex, 17),
          note: `Atividades executadas em ${taskCatalog[taskIndex].name.toLowerCase()}.`,
          source: 'ENTERPRISE_SEED',
        };

        await prisma.taskWorkLog.upsert({
          where: { id },
          update: data,
          create: { id, ...data },
        });
      }
    }
  }
}

async function seedProjectStats() {
  for (const [orgIndex, organization] of organizations.entries()) {
    const organizationUsers = organizationUserIndexes(organization);

    for (const [projectIndex] of organization.projects.entries()) {
      const projectKey = projectId(organization.code, projectIndex);
      const healthStatus =
        healthStatuses[(projectIndex + orgIndex) % healthStatuses.length];
      const healthScore =
        healthStatus === ProjectHealthStatus.SAFE
          ? 86 - projectIndex
          : healthStatus === ProjectHealthStatus.WARNING
            ? 64 - orgIndex
            : 38 + projectIndex;
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
        performance_per_member_json: performance,
        productivity_json: {
          completed_tasks: 12 + ((orgIndex + projectIndex) % 14),
          average_cycle_days: 3.2 + ((orgIndex + projectIndex) % 5) * 0.7,
          logged_hours: 48 + ((orgIndex * 8 + projectIndex * 3) % 52),
        },
        summary_json: {
          active_members: organizationUsers.length,
          completion_percentage: 35 + ((orgIndex * 11 + projectIndex * 7) % 61),
          open_risks: (orgIndex + projectIndex) % 6,
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
  for (const organization of organizations) {
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
        created_at: utcDate(-60 + projectIndex * 3, 9),
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
  await seedProjectsAndMembers();
  await seedTasks();
  await seedCommentsAndEvents();
  await seedWorkLogs();
  await seedProjectStats();
  await seedAuditLogs();

  console.info('Seed empresarial concluído com sucesso.');
  console.info('24 usuários, 5 organizações, 40 projetos e 400 tarefas.');
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
