import { Injectable } from '@nestjs/common';
import { PrismaService } from "src/database/prisma.service";
import { DefineAffiliationDTO } from "./dto/define.dto";
import { AffiliationDTO } from "./dto/affiliation.dto";
import { AffiliationQuery } from "./dto/query.dto";
import { AffiliationEditDTO } from "./dto/edit.dto";
import { UserOrganizationSummaryDTO } from "./dto/summary.dto";
import { OrgRole, Prisma } from "generated/prisma";
import {
  AffiliationNotFoundException,
  OrganizationNotFoundException,
} from "src/common/errors/resource-not-found.exceptions";
import { AccessDeniedException } from "src/common/errors/access-denied.exception";

type RepositoryAffiliationCreateDTO = Omit<DefineAffiliationDTO, 'role'> & {
  role?: OrgRole;
};

@Injectable()
export class AffiliationRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(data: RepositoryAffiliationCreateDTO): Promise<AffiliationDTO> {
    return this.prisma.affiliation.create({
      data: {
        userkey: data.userkey,
        orgkey: data.orgkey,
        role: data.role,
      },
    });
  }

  async delete(id: string, orgkey: string): Promise<AffiliationDTO> {
    return this.prisma.affiliation.delete({
      where: {
        id,
        orgkey,
      },
    });
  }

  async update(
    key: string,
    orgkey: string,
    update: AffiliationEditDTO,
  ): Promise<AffiliationDTO> {
    const result = await this.prisma.affiliation.update({
      where: {
        id: key,
        orgkey,
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

  async findByIdAndOrganization(
    id: string,
    orgkey: string,
  ): Promise<AffiliationDTO | null> {
    return this.prisma.affiliation.findFirst({
      where: { id, orgkey },
    });
  }

  async transferOwnership(
    orgkey: string,
    targetAffiliationId: string,
    currentOwnerkey: string,
  ): Promise<AffiliationDTO> {
    return this.prisma.$transaction(async (transaction) => {
      const organization = await transaction.organization.findUnique({
        where: { id: orgkey },
      });

      if (!organization) {
        throw new OrganizationNotFoundException();
      }

      if (organization.ownerkey !== currentOwnerkey) {
        throw new AccessDeniedException();
      }

      const target = await transaction.affiliation.findFirst({
        where: {
          id: targetAffiliationId,
          orgkey,
        },
      });

      if (!target) {
        throw new AffiliationNotFoundException();
      }

      const previousOwner = await transaction.affiliation.findUnique({
        where: {
          userkey_orgkey: {
            userkey: organization.ownerkey,
            orgkey,
          },
        },
      });

      if (!previousOwner) {
        throw new AffiliationNotFoundException();
      }

      if (previousOwner.id === target.id) {
        return target;
      }

      await transaction.affiliation.update({
        where: { id: previousOwner.id },
        data: { role: OrgRole.MEMBER },
      });
      const newOwner = await transaction.affiliation.update({
        where: { id: target.id },
        data: { role: OrgRole.OWNER },
      });
      await transaction.organization.update({
        where: { id: orgkey },
        data: { ownerkey: target.userkey },
      });

      return newOwner;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
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
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
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
