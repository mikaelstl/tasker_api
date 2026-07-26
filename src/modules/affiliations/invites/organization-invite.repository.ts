import { Injectable } from '@nestjs/common';
import { OrgRole } from 'generated/prisma';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class OrganizationInviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(
    operation: (repository: OrganizationInviteRepository) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction((transaction) =>
      operation(
        new OrganizationInviteRepository(
          transaction as unknown as PrismaService,
        ),
      ),
    );
  }

  create(orgkey: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.organizationInvite.create({
      data: { orgkey, tokenHash, expiresAt },
      select: {
        id: true,
        expiresAt: true,
      },
    });
  }

  findByTokenHash(tokenHash: string) {
    return this.prisma.organizationInvite.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        orgkey: true,
        expiresAt: true,
        usedAt: true,
        rejectedAt: true,
        revokedAt: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findAffiliation(userkey: string, orgkey: string) {
    return this.prisma.affiliation.findUnique({
      where: {
        userkey_orgkey: { userkey, orgkey },
      },
    });
  }

  claim(inviteId: string, now: Date) {
    return this.prisma.organizationInvite.updateMany({
      where: {
        id: inviteId,
        usedAt: null,
        rejectedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
  }

  createMemberAffiliation(userkey: string, orgkey: string) {
    return this.prisma.affiliation.create({
      data: {
        userkey,
        orgkey,
        role: OrgRole.MEMBER,
      },
    });
  }

  markRejected(inviteId: string, rejectedBy: string, now: Date) {
    return this.prisma.organizationInvite.updateMany({
      where: {
        id: inviteId,
        usedAt: null,
        rejectedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        rejectedAt: now,
        rejectedBy,
      },
    });
  }

  revoke(inviteId: string, orgkey: string, now: Date) {
    return this.prisma.organizationInvite.updateMany({
      where: {
        id: inviteId,
        orgkey,
        usedAt: null,
        rejectedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { revokedAt: now },
    });
  }
}
