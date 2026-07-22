import { Injectable } from '@nestjs/common';
import { PrismaService } from "src/database/prisma.service";
import { DefineAffiliationDTO } from "./dto/define.dto";
import { AffiliationDTO } from "./dto/affiliation.dto";
import { AffiliationQuery } from "./dto/query.dto";
import { AffiliationEditDTO } from "./dto/edit.dto";
import { UserOrganizationSummaryDTO } from "./dto/summary.dto";

@Injectable()
export class AffiliationRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: DefineAffiliationDTO): Promise<AffiliationDTO> {
    return this.prisma.affiliation.create({
      data: {
        userkey: data.userkey,
        orgkey: data.orgkey,
        role: data.role,
      },
    });
  }

  async delete(id: string): Promise<AffiliationDTO> {
    return this.prisma.affiliation.delete({
      where: {
        id,
      },
    });
  }

  async update(key: string, update: AffiliationEditDTO): Promise<AffiliationDTO> {
    const result = await this.prisma.affiliation.update({
      where: {
        id: key
      },
      data: update
    });

    return result;
  }

  async findById(key: string): Promise<AffiliationDTO> {
    const value = await this.prisma.affiliation.findUnique({
      where: {
        id: key
      }
    });

    return value;
  }

  async findWithQueries(queries: AffiliationQuery): Promise<AffiliationDTO[]> {
    const value = await this.prisma.affiliation.findMany({
      where: queries
    });

    return value;
  }

  async findByUserAndOrgkey(userkey: string, orgkey: string): Promise<AffiliationDTO> {
    const value = await this.prisma.affiliation.findFirst({
      where: {
        userkey,
        orgkey
      }
    });

    return value;
  }

  async findByOrganization(orgkey: string): Promise<AffiliationDTO[]> {
    return this.prisma.affiliation.findMany({
      where: {
        orgkey,
      },
      include: {
        user: true
      },
    });
  }

  async findOrganizationsByUser(
    userkey: string
  ): Promise<UserOrganizationSummaryDTO[]> {
    const affiliations = await this.prisma.affiliation.findMany({
      where: {
        userkey: userkey
      },
      select: {
        role: true,
        org: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                projects: true,
                members: true,
              }
            }
          }
        }
      },
    });

    return affiliations.map((affiliation) => ({
      orgkey: affiliation.org.id,
      role: affiliation.role,
      name: affiliation.org.name,
      projects: affiliation.org._count.projects,
      members: affiliation.org._count.members,
    }));
  }
}
