import { AccessSubject } from "@interfaces/AccessContext";
import { Resources } from "@enums/Resources.enum";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";

type ProjectResolveStrategy = (
  subject: AccessSubject,
) => Promise<string | null>;

@Injectable()
export class ProjectScopeResolver {
  private readonly projectResolveMethods: Map<
    Resources,
    ProjectResolveStrategy
  >;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.projectResolveMethods = new Map<Resources, ProjectResolveStrategy>([
      [Resources.PROJECTS, this.resolveProject.bind(this)],
      [Resources.PROJECT_STATS, this.resolveProject.bind(this)],
      [Resources.TASKS, this.resolveTaskProject.bind(this)],
      [Resources.COMMENTS, this.resolveCommentProject.bind(this)],
      [Resources.EVENTS, this.resolveEventProject.bind(this)],
      [Resources.MEMBERS, this.resolveMemberProject.bind(this)],
    ]);
  }

  async resolve(
    resource: Resources,
    subject: AccessSubject,
  ): Promise<string | null> {
    return await this.projectResolveMethods.get(resource)?.(subject) ?? null;
  }

  private async resolveProject(subject: AccessSubject): Promise<string | null> {
    return subject.projectkey ?? subject.targetkey ?? null;
  }

  private async resolveTaskProject(subject: AccessSubject): Promise<string | null> {
    if (!subject.targetkey || subject.targetkey === subject.projectkey) {
      return subject.projectkey ?? null;
    }

    const task = await this.prisma.task.findFirst({
      where: {
        id: subject.targetkey,
        project: {
          orgkey: subject.orgkey,
        },
      },
      select: {
        projectkey: true,
      },
    });

    return task?.projectkey ?? null;
  }

  private async resolveCommentProject(subject: AccessSubject): Promise<string | null> {
    if (!subject.targetkey || subject.targetkey === subject.projectkey) {
      return subject.projectkey ?? null;
    }

    const comment = await this.prisma.comment.findFirst({
      where: {
        id: subject.targetkey,
        project: {
          orgkey: subject.orgkey,
        },
      },
      select: {
        projectkey: true,
      },
    });

    return comment?.projectkey ?? null;
  }

  private async resolveEventProject(subject: AccessSubject): Promise<string | null> {
    const eventkey = subject.taskcode
      ?? (
        subject.targetkey !== subject.projectkey
          ? subject.targetkey
          : null
      );

    if (!eventkey) {
      return subject.projectkey ?? null;
    }

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventkey,
        project: {
          orgkey: subject.orgkey,
        },
      },
      select: {
        projectkey: true,
      },
    });

    return event?.projectkey ?? null;
  }

  private async resolveMemberProject(subject: AccessSubject): Promise<string | null> {
    if (!subject.targetkey || subject.targetkey === subject.projectkey) {
      return subject.projectkey ?? null;
    }

    const member = await this.prisma.member.findFirst({
      where: {
        id: subject.targetkey,
        project: {
          orgkey: subject.orgkey,
        },
      },
      select: {
        projectkey: true,
      },
    });

    return member?.projectkey ?? null;
  }
}
