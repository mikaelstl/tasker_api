import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from "src/database/prisma.service";
import { OrganizationCreateDTO } from "@modules/organization/dto/create.dto";
import { OrganizationDTO } from "@modules/organization/dto/organization.dto";
import { OrganizationSummaryDTO } from "@modules/organization/dto/summary.dto";

type OrgFindQuery = {
  id?: string,
  name?: string,
  ownerkey: string,
}

@Injectable()
export class OrganizationRepository {
  private logger: Logger = new Logger('OrganizationRepository');

  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: OrganizationCreateDTO): Promise<OrganizationDTO> {
    // await this.organizationExists(data.email);

    const result = await this.prisma.organization.create({
      data: {
        name: data.name,
        ownerkey: data.ownerkey,
      }
    });

    return result;
  }

  async find(key: string, query?: OrgFindQuery): Promise<OrganizationDTO> {
    const result = await this.prisma.organization.findFirst({
      where: {
        id: key,
        ...query
      },
      include: {
        members: true
      }
    });

    return result;
  }

  async findSummary(key: string): Promise<OrganizationSummaryDTO | null> {
    const result = await this.prisma.organization.findUnique({
      where: {
        id: key,
      },
      select: {
        name: true,
        _count: {
          select: {
            projects: true,
            members: true,
          },
        },
      },
    });

    if (!result) {
      return null;
    }

    return {
      name: result.name,
      projects: result._count.projects,
      members: result._count.members,
    };
  }

  async delete(key: string): Promise<OrganizationDTO> {
    const result = await this.prisma.organization.delete({
      where: {
        id: key
      },
      include: {
        projects: true,
        members: true
      }
    });

    return result;
  }

  async exists(query: OrgFindQuery): Promise<boolean> {
    const result = await this.prisma.organization.count({
      where: query
    });

    return result > 0;
  }
}
