import { Injectable } from "@nestjs/common";
import PDFDocument = require("pdfkit");
import { join } from "node:path";
import {
  ProjectHealthStatus,
  StatsPeriodType,
  TaskStage
} from "generated/prisma";
import { ProjectStats } from "./stats.types";

type ReportSource = {
  reportId: string;
  periodType: StatsPeriodType;
  stats: ProjectStats;
  historicalSnapshots: any[];
};

type Column = {
  label: string;
  width: number;
  align?: "left" | "center" | "right";
};

const A4 = {
  width: 595.28,
  height: 841.89
};
const MARGIN = 42;
const CONTENT_WIDTH = A4.width - (MARGIN * 2);
const COLORS = {
  ink: "#17213a",
  muted: "#667085",
  line: "#dfe4ec",
  light: "#f4f6f9",
  blue: "#3166e8",
  cyan: "#27b4c4",
  green: "#22a06b",
  amber: "#d88a18",
  red: "#d64545",
  white: "#ffffff"
};
const SERIES_COLORS = [
  "#3166e8",
  "#27b4c4",
  "#8b5cf6",
  "#e8793e",
  "#22a06b",
  "#d64545"
];

@Injectable()
export class ProjectStatsReportDocument {
  async generate(source: ReportSource): Promise<Buffer> {
    const document = new PDFDocument({
      size: "A4",
      margin: MARGIN,
      bufferPages: true,
      info: {
        Title: `Tasker - Relatório de Desempenho - ${source.stats.project.title}`,
        Author: "Tasker",
        Subject: "Relatório de desempenho em projetos"
      }
    });
    const chunks: Buffer[] = [];

    document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    const completed = new Promise<Buffer>((resolve, reject) => {
      document.on("end", () => resolve(Buffer.concat(chunks)));
      document.on("error", reject);
    });

    this.registerFonts(document);
    this.cover(document, source);
    this.executiveSummary(document, source);
    this.evolution(document, source);
    this.memberPerformance(document, source);
    this.memberTasks(document, source);
    this.agenda(document, source);
    this.health(document, source);
    this.addFooters(document, source);
    document.end();

    return completed;
  }

  private registerFonts(document: PDFKit.PDFDocument): void {
    document.registerFont(
      "Poppins",
      join(__dirname, "assets/fonts/Poppins-Regular.ttf")
    );
    document.registerFont(
      "Poppins-SemiBold",
      join(__dirname, "assets/fonts/Poppins-SemiBold.ttf")
    );
    document.registerFont(
      "Poppins-Bold",
      join(__dirname, "assets/fonts/Poppins-Bold.ttf")
    );
  }

  private cover(document: PDFKit.PDFDocument, source: ReportSource): void {
    const { stats } = source;
    document.rect(0, 0, A4.width, 11).fill(COLORS.blue);
    document
      .font("Poppins-Bold")
      .fontSize(28)
      .fillColor(COLORS.blue)
      .text("Tasker", MARGIN, 60);
    document
      .font("Poppins-Bold")
      .fontSize(25)
      .fillColor(COLORS.ink)
      .text("RELATÓRIO DE", MARGIN, 148)
      .text("DESEMPENHO EM PROJETOS");
    document
      .font("Poppins")
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(
        "Acompanhamento de progresso, prazo, saúde e desempenho da equipe",
        MARGIN,
        220
      );
    document
      .moveTo(MARGIN, 254)
      .lineTo(A4.width - MARGIN, 254)
      .strokeColor(COLORS.line)
      .stroke();

    const start = stats.project.startedAt ?? stats.generatedAt;
    const rows = [
      ["Projeto", stats.project.title],
      ["Organização", stats.project.organization],
      ["Período avaliado", `${this.date(start)} a ${this.date(stats.cutoffAt)}`],
      ["Responsável", stats.project.manager ?? "Não definido"],
      ["Data de corte", this.dateTime(stats.cutoffAt)]
    ];
    let y = 295;

    for (const [label, value] of rows) {
      document
        .font("Poppins-SemiBold")
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(label.toUpperCase(), MARGIN, y, { width: 120 });
      document
        .font("Poppins")
        .fontSize(10)
        .fillColor(COLORS.ink)
        .text(value, MARGIN + 135, y - 1, { width: CONTENT_WIDTH - 135 });
      y += 52;
    }

    document
      .roundedRect(MARGIN, 606, CONTENT_WIDTH, 92, 8)
      .fill(COLORS.light);
    document
      .font("Poppins-SemiBold")
      .fontSize(9)
      .fillColor(COLORS.blue)
      .text("RELATÓRIO GERADO A PARTIR DAS ESTATÍSTICAS DO PROJETO", 60, 628);
    document
      .font("Poppins")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `Código do projeto: ${stats.project.id}  •  Registro: ${source.reportId}`,
        60,
        652,
        { width: CONTENT_WIDTH - 36 }
      );
  }

  private executiveSummary(
    document: PDFKit.PDFDocument,
    source: ReportSource
  ): void {
    const { stats } = source;
    this.sectionPage(
      document,
      "1. Resumo executivo",
      "Visão consolidada do estado atual do projeto no instante do corte."
    );
    this.keyValueGrid(document, 126, [
      ["Projeto", stats.project.title],
      ["Código", stats.project.id],
      ["Início", this.date(stats.project.startedAt)],
      ["Prazo", this.date(stats.project.deadline)],
      ["Status", this.projectStage(stats.project.stage)],
      ["Período", `${this.date(stats.project.startedAt)} a ${this.date(stats.cutoffAt)}`]
    ]);

    const cards = [
      ["TAREFAS", String(stats.summary.totalTasks), `${stats.summary.doneTasks} concluídas`],
      ["PROGRESSO", `${stats.summary.progress}%`, `${stats.summary.openTasks} tarefas abertas`],
      ["ATRASADAS", String(stats.summary.delayedTasks), "independente do estágio"],
      ["PRAZO RESTANTE", `${stats.deadline.daysLeft} dias`, `entrega em ${this.date(stats.project.deadline)}`]
    ];
    this.metricCards(document, 282, cards);

    document
      .roundedRect(MARGIN, 410, CONTENT_WIDTH * 0.64, 205, 8)
      .fill(COLORS.light);
    this.label(document, "ANÁLISE EXECUTIVA", 60, 433, COLORS.blue);
    const projected = stats.health.projectedDeliveryAt
      ? this.date(stats.health.projectedDeliveryAt)
      : "indisponível";
    const analysis = [
      `Situação geral: progresso de ${stats.summary.progress}% com ${stats.summary.openTasks} tarefas abertas.`,
      stats.summary.delayedTasks > 0
        ? `Ponto de atenção: ${stats.summary.delayedTasks} tarefa(s) atrasada(s).`
        : "Nenhuma tarefa atrasada no instante do corte.",
      `Saúde: score ${stats.health.score}/100, classificado como ${this.healthLabel(stats.health.status)}.`,
      `Previsão atual de entrega: ${projected}.`
    ];
    let y = 467;

    for (const item of analysis) {
      document.circle(65, y + 4, 2).fill(COLORS.blue);
      document
        .font("Poppins")
        .fontSize(8.5)
        .fillColor(COLORS.ink)
        .text(item, 76, y, { width: 275, lineGap: 3 });
      y += 35;
    }

    this.healthBadge(
      document,
      MARGIN + (CONTENT_WIDTH * 0.68),
      445,
      CONTENT_WIDTH * 0.32,
      stats
    );
  }

  private evolution(
    document: PDFKit.PDFDocument,
    source: ReportSource
  ): void {
    this.sectionPage(
      document,
      "2. Evolução do projeto",
      "Histórico de snapshots: progresso, saúde e tendência observados ao longo do tempo."
    );
    this.label(document, "HISTÓRICO CONSOLIDADO POR PERÍODO", MARGIN, 132);

    const snapshots = source.historicalSnapshots.slice(-12);
    const rows = snapshots.length > 0
      ? snapshots.map((snapshot) => [
        this.periodLabel(snapshot),
        `${this.jsonNumber(snapshot.summary_json, "progress")}%`,
        `${snapshot.health_score}/100`,
        this.healthLabel(snapshot.health_status)
      ])
      : [[
        this.periodName(source.periodType),
        `${source.stats.summary.progress}%`,
        `${source.stats.health.score}/100`,
        this.healthLabel(source.stats.health.status)
      ]];

    this.table(document, 160, [
      { label: "Período", width: 145 },
      { label: "Progresso", width: 120 },
      { label: "Saúde", width: 120 },
      { label: "Classificação", width: 126 }
    ], rows, 32);

    const readingY = Math.min(600, 205 + (rows.length * 32));
    document.roundedRect(MARGIN, readingY, CONTENT_WIDTH, 102, 8).fill(COLORS.light);
    this.label(document, "LEITURA GERENCIAL", 60, readingY + 20, COLORS.blue);
    const first = snapshots[0];
    const scoreChange = first
      ? `${first.health_score} para ${source.stats.health.score}`
      : `${source.stats.health.score}`;
    document
      .font("Poppins")
      .fontSize(8.5)
      .fillColor(COLORS.ink)
      .text(
        `O projeto está com ${source.stats.summary.progress}% de progresso. O score de saúde evoluiu de ${scoreChange}. ${source.stats.health.reason}`,
        60,
        readingY + 47,
        { width: CONTENT_WIDTH - 36, lineGap: 4 }
      );
  }

  private memberPerformance(
    document: PDFKit.PDFDocument,
    source: ReportSource
  ): void {
    const { stats } = source;
    this.sectionPage(
      document,
      "3. Desempenho dos membros",
      "Média de horas, produtividade e situação das tarefas atribuídas."
    );
    this.label(
      document,
      "PERFORMANCE POR MEMBRO — MÉDIA DE HORAS POR MÊS",
      MARGIN,
      126
    );
    this.lineChart(document, 155, stats);
    this.label(
      document,
      "PRODUTIVIDADE — TAREFAS CONCLUÍDAS X ATRASADAS",
      MARGIN,
      405
    );
    this.productivityChart(document, 434, stats);
    this.label(document, "RESUMO POR MEMBRO", MARGIN, 590);

    const productivity = new Map(
      stats.productivity.map((item) => [item.memberId, item])
    );
    const rows = stats.members.slice(0, 5).map((member) => [
      member.user.name,
      String(member.completedTasks),
      String(member.startedTasks),
      String(member.reviewTasks),
      String(member.delayedTasks),
      `${stats.performancePerMember.find(
        (item) => item.memberId === member.memberId
      )?.averageHoursPerMonth ?? 0} h`,
      String(productivity.get(member.memberId)?.ratio ?? 0)
    ]);
    this.table(document, 616, [
      { label: "Membro", width: 139 },
      { label: "Concl.", width: 54, align: "center" },
      { label: "Inic.", width: 49, align: "center" },
      { label: "Rev.", width: 45, align: "center" },
      { label: "Atras.", width: 53, align: "center" },
      { label: "Média/mês", width: 86, align: "right" },
      { label: "Índice", width: 85, align: "right" }
    ], rows, 24, 7);
  }

  private memberTasks(
    document: PDFKit.PDFDocument,
    source: ReportSource
  ): void {
    const { stats } = source;
    this.sectionPage(
      document,
      "4. Relação de tarefas por membro",
      "Detalhamento das tarefas, estágio atual, tempo gasto e prazo."
    );
    let y = 128;

    for (const member of stats.members) {
      const requiredHeight = 44 + (Math.max(member.tasks.length, 1) * 26);

      if (y + requiredHeight > 750) {
        this.sectionPage(
          document,
          "4. Relação de tarefas por membro",
          "Continuação do detalhamento das tarefas."
        );
        y = 128;
      }

      document
        .roundedRect(MARGIN, y, CONTENT_WIDTH, 30, 5)
        .fill(COLORS.light);
      document
        .font("Poppins-SemiBold")
        .fontSize(9)
        .fillColor(COLORS.ink)
        .text(member.user.name, MARGIN + 12, y + 10);
      y += 37;

      const rows = member.tasks.length > 0
        ? member.tasks.map((task) => [
          task.code,
          task.name,
          task.delayed ? "ATRASADA" : this.taskStage(task.stage),
          this.duration(task.spentMinutes),
          this.date(task.deadline)
        ])
        : [["—", "Nenhuma tarefa atribuída", "—", "0h 00min", "—"]];
      this.table(document, y, [
        { label: "Código", width: 70 },
        { label: "Tarefa", width: 224 },
        { label: "Status", width: 86 },
        { label: "Tempo", width: 74, align: "right" },
        { label: "Prazo", width: 57, align: "right" }
      ], rows, 26, 7);
      y += 26 + (rows.length * 26) + 15;
    }

    if (y < 730) {
      document
        .font("Poppins")
        .fontSize(7)
        .fillColor(COLORS.muted)
        .text(
          "O tempo gasto prioriza apontamentos persistidos. Na ausência de logs, utiliza-se o ciclo entre início e conclusão/corte.",
          MARGIN,
          y + 4,
          { width: CONTENT_WIDTH }
        );
    }
  }

  private agenda(
    document: PDFKit.PDFDocument,
    source: ReportSource
  ): void {
    const { stats } = source;
    this.sectionPage(
      document,
      "5. Agenda e marcos do projeto",
      "Eventos integrados ao relatório para apoiar acompanhamento e governança."
    );
    const events = stats.events
      .filter((event) => event.date.getTime() >= stats.cutoffAt.getTime())
      .slice(0, 8);
    this.label(document, "PRÓXIMOS EVENTOS", MARGIN, 132);
    let y = 163;

    if (events.length === 0) {
      document
        .font("Poppins")
        .fontSize(9)
        .fillColor(COLORS.muted)
        .text("Nenhum evento futuro cadastrado.", MARGIN, y);
      y += 50;
    } else {
      for (const event of events) {
        document.circle(MARGIN + 6, y + 8, 4).fill(COLORS.blue);
        document
          .font("Poppins-SemiBold")
          .fontSize(8.5)
          .fillColor(COLORS.ink)
          .text(this.dateTime(event.date), MARGIN + 22, y);
        document
          .font("Poppins")
          .fontSize(9)
          .fillColor(COLORS.ink)
          .text(event.title, MARGIN + 155, y, { width: 265 });
        document
          .font("Poppins")
          .fontSize(7)
          .fillColor(COLORS.muted)
          .text(this.eventCategory(event.category), MARGIN + 425, y + 1);
        y += 42;
      }
    }

    y = Math.max(y + 18, 430);
    this.label(document, "MARCOS DE ACOMPANHAMENTO", MARGIN, y);
    const milestones = [
      [
        this.date(stats.project.startedAt),
        "Início formal do projeto",
        stats.project.startedAt ? "CONCLUÍDO" : "NÃO INFORMADO"
      ],
      [this.date(stats.cutoffAt), "Corte deste relatório", "ATUAL"],
      [
        this.date(stats.health.projectedDeliveryAt),
        "Entrega projetada",
        stats.health.projectedDeliveryAt ? "PROJEÇÃO" : "INDISPONÍVEL"
      ],
      [this.date(stats.project.deadline), "Prazo final do projeto", "PLANEJADO"]
    ];
    this.table(document, y + 28, [
      { label: "Data", width: 96 },
      { label: "Marco", width: 300 },
      { label: "Situação", width: 115, align: "right" }
    ], milestones, 34);
  }

  private health(
    document: PDFKit.PDFDocument,
    source: ReportSource
  ): void {
    const { stats } = source;
    this.sectionPage(
      document,
      "6. Saúde, riscos e recomendações",
      "Síntese baseada no estado atual, atrasos, ritmo e projeção de entrega."
    );
    document.roundedRect(MARGIN, 132, CONTENT_WIDTH, 120, 8).fill(COLORS.light);
    this.label(document, "SAÚDE DO PROJETO", 60, 153, COLORS.blue);
    document
      .font("Poppins-Bold")
      .fontSize(18)
      .fillColor(this.healthColor(stats.health.status))
      .text(this.healthLabel(stats.health.status), 60, 184);
    document
      .font("Poppins-Bold")
      .fontSize(18)
      .fillColor(COLORS.ink)
      .text(`${stats.health.score}/100`, 210, 184);
    document
      .font("Poppins")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `Entrega projetada: ${this.date(stats.health.projectedDeliveryAt)} • Prazo: ${this.date(stats.project.deadline)}`,
        60,
        218
      );

    this.label(document, "RISCOS OBSERVADOS", MARGIN, 288);
    const risks = this.risks(stats);
    this.table(document, 315, [
      { label: "ID", width: 46 },
      { label: "Risco", width: 250 },
      { label: "Prob.", width: 65, align: "center" },
      { label: "Impacto", width: 67, align: "center" },
      { label: "Ação recomendada", width: 83 }
    ], risks, 42, 6.5);

    this.label(document, "RECOMENDAÇÕES GERENCIAIS", MARGIN, 515);
    const recommendations = [
      ["1", "Recuperar atrasos prioritários", "Tratar primeiro tarefas atrasadas que bloqueiam entregas."],
      ["2", "Acompanhar saúde periodicamente", "Revisar score, motivo e projeção a cada snapshot."],
      ["3", "Consolidar apontamentos de tempo", "Garantir logs consistentes para representar o esforço real."],
      ["4", "Preservar rastreabilidade", "Manter relatórios com data de corte para comparação histórica."]
    ];
    let y = 548;

    for (const [number, title, description] of recommendations) {
      document.circle(MARGIN + 10, y + 10, 10).fill(COLORS.blue);
      document
        .font("Poppins-SemiBold")
        .fontSize(8)
        .fillColor(COLORS.white)
        .text(number, MARGIN + 7, y + 6, { width: 7, align: "center" });
      document
        .font("Poppins-SemiBold")
        .fontSize(8)
        .fillColor(COLORS.ink)
        .text(title, MARGIN + 32, y);
      document
        .font("Poppins")
        .fontSize(7)
        .fillColor(COLORS.muted)
        .text(description, MARGIN + 32, y + 14);
      y += 45;
    }

    document
      .font("Poppins")
      .fontSize(6.5)
      .fillColor(COLORS.muted)
      .text(
        `Rastreabilidade: periodType=${source.periodType} • cutoffAt=${stats.cutoffAt.toISOString()} • generatedAt=${stats.generatedAt.toISOString()} • reportId=${source.reportId}`,
        MARGIN,
        750,
        { width: CONTENT_WIDTH }
      );
  }

  private sectionPage(
    document: PDFKit.PDFDocument,
    title: string,
    subtitle: string
  ): void {
    document.addPage();
    document.rect(0, 0, A4.width, 7).fill(COLORS.blue);
    document
      .font("Poppins-Bold")
      .fontSize(13)
      .fillColor(COLORS.blue)
      .text("Tasker", MARGIN, 34);
    document
      .font("Poppins-SemiBold")
      .fontSize(7)
      .fillColor(COLORS.muted)
      .text("RELATÓRIO DE DESEMPENHO EM PROJETOS", 330, 39, {
        width: 223,
        align: "right"
      });
    document
      .moveTo(MARGIN, 66)
      .lineTo(A4.width - MARGIN, 66)
      .strokeColor(COLORS.line)
      .stroke();
    document
      .font("Poppins-Bold")
      .fontSize(18)
      .fillColor(COLORS.ink)
      .text(title, MARGIN, 82);
    document
      .font("Poppins")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(subtitle, MARGIN, 108);
  }

  private keyValueGrid(
    document: PDFKit.PDFDocument,
    y: number,
    items: string[][]
  ): void {
    const width = CONTENT_WIDTH / 2;

    items.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = MARGIN + (column * width);
      const itemY = y + (row * 48);
      this.label(document, label.toUpperCase(), x, itemY);
      document
        .font("Poppins")
        .fontSize(9)
        .fillColor(COLORS.ink)
        .text(value, x, itemY + 16, { width: width - 20, ellipsis: true });
    });
  }

  private metricCards(
    document: PDFKit.PDFDocument,
    y: number,
    cards: string[][]
  ): void {
    const gap = 8;
    const width = (CONTENT_WIDTH - (gap * 3)) / 4;

    cards.forEach(([label, value, detail], index) => {
      const x = MARGIN + (index * (width + gap));
      document.roundedRect(x, y, width, 94, 6).fill(COLORS.light);
      this.label(document, label, x + 12, y + 14);
      document
        .font("Poppins-Bold")
        .fontSize(19)
        .fillColor(COLORS.ink)
        .text(value, x + 12, y + 36, { width: width - 24 });
      document
        .font("Poppins")
        .fontSize(6.5)
        .fillColor(COLORS.muted)
        .text(detail, x + 12, y + 69, { width: width - 24 });
    });
  }

  private lineChart(
    document: PDFKit.PDFDocument,
    y: number,
    stats: ProjectStats
  ): void {
    const chart = { x: MARGIN + 34, y, width: CONTENT_WIDTH - 45, height: 185 };
    const allValues = stats.performancePerMember.flatMap((member) =>
      member.months.map((item) => item.averageHours)
    );
    const max = Math.max(5, ...allValues);
    const months = stats.performancePerMember[0]?.months.map(
      (item) => item.month
    ) ?? [];

    for (let index = 0; index <= 4; index += 1) {
      const rowY = chart.y + ((chart.height / 4) * index);
      const value = this.round(max - ((max / 4) * index));
      document
        .moveTo(chart.x, rowY)
        .lineTo(chart.x + chart.width, rowY)
        .strokeColor(COLORS.line)
        .stroke();
      document
        .font("Poppins")
        .fontSize(6)
        .fillColor(COLORS.muted)
        .text(`${value}h`, MARGIN, rowY - 3, { width: 28, align: "right" });
    }

    const step = months.length > 1 ? chart.width / (months.length - 1) : 0;
    months.forEach((month, index) => {
      const x = chart.x + (months.length === 1 ? chart.width / 2 : step * index);
      document
        .font("Poppins")
        .fontSize(6)
        .fillColor(COLORS.muted)
        .text(this.monthLabel(month), x - 30, chart.y + chart.height + 8, {
          width: 60,
          align: "center"
        });
    });

    stats.performancePerMember.slice(0, 6).forEach((member, memberIndex) => {
      const color = SERIES_COLORS[memberIndex];
      const points = member.months.map((item, index) => ({
        x: chart.x + (
          member.months.length === 1
            ? chart.width / 2
            : step * index
        ),
        y: chart.y + chart.height - (
          (item.averageHours / max) * chart.height
        )
      }));

      points.forEach((point, index) => {
        if (index === 0) {
          document.moveTo(point.x, point.y);
        } else {
          document.lineTo(point.x, point.y);
        }
      });
      document.lineWidth(1.6).strokeColor(color).stroke();
      points.forEach((point) => document.circle(point.x, point.y, 2.5).fill(color));

      const legendX = MARGIN + (memberIndex % 3) * 170;
      const legendY = chart.y + chart.height + 29 + Math.floor(memberIndex / 3) * 13;
      document.rect(legendX, legendY + 2, 7, 3).fill(color);
      document
        .font("Poppins")
        .fontSize(6.5)
        .fillColor(COLORS.ink)
        .text(member.user.name, legendX + 12, legendY, { width: 150 });
    });
  }

  private productivityChart(
    document: PDFKit.PDFDocument,
    y: number,
    stats: ProjectStats
  ): void {
    const max = Math.max(
      1,
      ...stats.productivity.flatMap((item) => [item.completed, item.delayed])
    );
    const barMax = 245;
    let rowY = y;

    for (const member of stats.members.slice(0, 5)) {
      const item = stats.productivity.find(
        (value) => value.memberId === member.memberId
      );

      if (!item) {
        continue;
      }

      document
        .font("Poppins")
        .fontSize(7)
        .fillColor(COLORS.ink)
        .text(member.user.name, MARGIN, rowY + 3, { width: 115 });
      document
        .rect(MARGIN + 120, rowY, (item.completed / max) * barMax, 7)
        .fill(COLORS.blue);
      document
        .rect(MARGIN + 120, rowY + 10, (item.delayed / max) * barMax, 7)
        .fill(COLORS.red);
      document
        .font("Poppins")
        .fontSize(6)
        .fillColor(COLORS.muted)
        .text(`${item.completed} concluídas • ${item.delayed} atrasadas`, MARGIN + 375, rowY + 3);
      rowY += 27;
    }
  }

  private table(
    document: PDFKit.PDFDocument,
    y: number,
    columns: Column[],
    rows: string[][],
    rowHeight: number,
    fontSize = 7.5
  ): void {
    let x = MARGIN;
    document.rect(MARGIN, y, CONTENT_WIDTH, rowHeight).fill(COLORS.light);

    columns.forEach((column) => {
      document
        .font("Poppins-SemiBold")
        .fontSize(Math.max(fontSize - 1, 5.5))
        .fillColor(COLORS.muted)
        .text(column.label.toUpperCase(), x + 5, y + 9, {
          width: column.width - 10,
          align: column.align ?? "left",
          ellipsis: true
        });
      x += column.width;
    });

    rows.forEach((row, rowIndex) => {
      const rowY = y + rowHeight + (rowIndex * rowHeight);
      x = MARGIN;
      document
        .moveTo(MARGIN, rowY)
        .lineTo(MARGIN + CONTENT_WIDTH, rowY)
        .strokeColor(COLORS.line)
        .lineWidth(0.5)
        .stroke();

      columns.forEach((column, columnIndex) => {
        document
          .font("Poppins")
          .fontSize(fontSize)
          .fillColor(COLORS.ink)
          .text(String(row[columnIndex] ?? ""), x + 5, rowY + 8, {
            width: column.width - 10,
            height: rowHeight - 10,
            align: column.align ?? "left",
            ellipsis: true
          });
        x += column.width;
      });
    });
  }

  private healthBadge(
    document: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    stats: ProjectStats
  ): void {
    document.roundedRect(x, y, width, 130, 8).fill(COLORS.light);
    this.label(document, "SAÚDE DO PROJETO", x + 18, y + 20);
    document
      .font("Poppins-Bold")
      .fontSize(13)
      .fillColor(this.healthColor(stats.health.status))
      .text(this.healthLabel(stats.health.status), x + 18, y + 51, {
        width: width - 36,
        align: "center"
      });
    document
      .font("Poppins-Bold")
      .fontSize(18)
      .fillColor(COLORS.ink)
      .text(`${stats.health.score}/100`, x + 18, y + 82, {
        width: width - 36,
        align: "center"
      });
  }

  private addFooters(
    document: PDFKit.PDFDocument,
    source: ReportSource
  ): void {
    const range = document.bufferedPageRange();

    for (let index = range.start; index < range.start + range.count; index += 1) {
      document.switchToPage(index);

      if (index === 0) {
        continue;
      }

      document
        .moveTo(MARGIN, 772)
        .lineTo(A4.width - MARGIN, 772)
        .strokeColor(COLORS.line)
        .lineWidth(0.5)
        .stroke();
      document
        .font("Poppins")
        .fontSize(6.5)
        .fillColor(COLORS.muted)
        .text(source.stats.project.id, MARGIN, 782);
      document.text(
        "Relatório gerado pelo Tasker",
        180,
        782,
        { width: 235, align: "center" }
      );
      document.text(
        `Página ${index + 1} de ${range.count}`,
        450,
        782,
        { width: 103, align: "right" }
      );
    }
  }

  private risks(stats: ProjectStats): string[][] {
    const delayedRisk = stats.summary.delayedTasks > 0 ? "MÉDIA" : "BAIXA";
    const scheduleRisk = stats.health.status === ProjectHealthStatus.SAFE
      ? "BAIXA"
      : "MÉDIA";

    return [
      ["R-01", "Tarefas atrasadas afetarem a cadência", delayedRisk, "ALTO", "Priorizar atrasos"],
      ["R-02", "Projeção de entrega ultrapassar o prazo", scheduleRisk, "ALTO", "Ajustar o ritmo"],
      ["R-03", "Apontamentos incompletos reduzirem a fidelidade", "MÉDIA", "MÉDIO", "Reforçar os logs"],
      ["R-04", "Histórico insuficiente para comparação", "BAIXA", "MÉDIO", "Gerar snapshots"]
    ];
  }

  private periodLabel(snapshot: any): string {
    const start = new Date(snapshot.period_start);
    const end = new Date(snapshot.period_end);
    return `${this.date(start)} a ${this.date(end)}`;
  }

  private jsonNumber(value: any, key: string): number {
    const result = Number(value?.[key]);
    return Number.isFinite(result) ? result : 0;
  }

  private date(value: Date | string | null | undefined): string {
    if (!value) {
      return "Não informado";
    }

    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: "UTC"
    }).format(date);
  }

  private dateTime(value: Date): string {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "UTC"
    }).format(value);
  }

  private duration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${String(minutes % 60).padStart(2, "0")}min`;
  }

  private monthLabel(value: string): string {
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC"
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }

  private periodName(period: StatsPeriodType): string {
    return {
      [StatsPeriodType.WEEK]: "Semana atual",
      [StatsPeriodType.MONTH]: "Mês atual",
      [StatsPeriodType.QUARTER]: "Trimestre atual"
    }[period];
  }

  private healthLabel(status: ProjectHealthStatus): string {
    return {
      [ProjectHealthStatus.SAFE]: "SEGURO",
      [ProjectHealthStatus.WARNING]: "ATENÇÃO",
      [ProjectHealthStatus.CRITICAL]: "CRÍTICO"
    }[status];
  }

  private healthColor(status: ProjectHealthStatus): string {
    return {
      [ProjectHealthStatus.SAFE]: COLORS.green,
      [ProjectHealthStatus.WARNING]: COLORS.amber,
      [ProjectHealthStatus.CRITICAL]: COLORS.red
    }[status];
  }

  private taskStage(stage: TaskStage): string {
    return {
      [TaskStage.STARTED]: "INICIADA",
      [TaskStage.PENDING]: "PENDENTE",
      [TaskStage.IN_PROGRESS]: "EM ANDAMENTO",
      [TaskStage.REVIEW]: "REVISÃO",
      [TaskStage.DONE]: "CONCLUÍDA",
      [TaskStage.DELAYED]: "ATRASADA"
    }[stage];
  }

  private projectStage(stage: string): string {
    return stage.replaceAll("_", " ");
  }

  private eventCategory(category: string): string {
    const labels: Record<string, string> = {
      RELEASE: "Entrega",
      MEETING: "Reunião",
      REVIEW: "Revisão",
      PLANNING: "Planejamento",
      TESTS: "Testes",
      LAUNCH: "Lançamento"
    };
    return labels[category] ?? category;
  }

  private label(
    document: PDFKit.PDFDocument,
    text: string,
    x: number,
    y: number,
    color = COLORS.muted
  ): void {
    document
      .font("Poppins-SemiBold")
      .fontSize(7)
      .fillColor(color)
      .text(text, x, y);
  }

  private round(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
