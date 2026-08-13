import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import * as jwt from 'jsonwebtoken';
import { BusinessException } from 'src/common/errors/business.exception';
import { ConflictException } from 'src/common/errors/conflict.exception';
import { InternalException } from 'src/common/errors/internal.exception';
import { InviteUnavailableException } from 'src/common/errors/invite-unavailable.exception';
import { ORGANIZATION_INVITE_SECRET } from 'src/config/env.config';
import { OrganizationInviteRepository } from './organization-invite.repository';
import { DateTime } from 'luxon';

type OrganizationInviteTokenPayload = {
  orgkey: string;
  exp: number;
};

const INVITE_LIFETIME_SECONDS = 24 * 60 * 60;

@Injectable()
export class OrganizationInviteService {
  constructor(private readonly repository: OrganizationInviteRepository) {}

  async create(orgkey: string, username: string) {
    void username;
    const exp = Math.floor(
      DateTime.now().plus({ seconds: INVITE_LIFETIME_SECONDS }).toSeconds(),
    );
    const expiresAt = DateTime.fromSeconds(exp).toJSDate();
    const secret = this.getSecret();
    let token: string;

    try {
      token = jwt.sign(
        { orgkey, exp } satisfies OrganizationInviteTokenPayload,
        secret,
        {
          algorithm: 'HS256',
          noTimestamp: true,
          header: {
            alg: 'HS256',
            typ: 'JWT',
            nonce: randomBytes(16).toString('hex'),
          } as jwt.JwtHeader,
        },
      );
    } catch (error) {
      throw new InternalException(
        'Falha ao assinar o convite da organização.',
        error,
      );
    }

    let invite: Awaited<ReturnType<OrganizationInviteRepository['create']>>;

    try {
      invite = await this.repository.create(
        orgkey,
        this.hash(token),
        expiresAt,
      );
    } catch (error) {
      throw new InternalException(
        'Falha ao persistir o convite da organização.',
        error,
      );
    }

    return {
      id: invite.id,
      token,
      expiresAt: invite.expiresAt,
    };
  }

  async preview(token: string) {
    let payload: OrganizationInviteTokenPayload;
    const secret = this.getSecret();

    try {
      payload = this.verify(token, secret);
    } catch {
      return this.unavailablePreview();
    }

    let invite: Awaited<
      ReturnType<OrganizationInviteRepository['findByTokenHash']>
    >;

    try {
      invite = await this.repository.findByTokenHash(this.hash(token));
    } catch (error) {
      throw new InternalException(
        'Falha ao consultar o convite da organização.',
        error,
      );
    }

    const now = DateTime.now().toJSDate();
    const payloadExpiresAt = DateTime.fromSeconds(payload.exp).toJSDate();

    if (!this.isAvailable(invite, payload.orgkey, payloadExpiresAt, now)) {
      return this.unavailablePreview();
    }

    return {
      valid: true,
      expiresAt: invite.expiresAt,
      organization: invite.org,
    };
  }

  async accept(token: string, username: string) {
    const payload = this.verifyOrUnavailable(token);
    const tokenHash = this.hash(token);
    const expiresAt = DateTime.fromSeconds(payload.exp).toJSDate();
    const now = DateTime.now().toJSDate();

    try {
      return await this.repository.transaction(async (repository) => {
        const invite = await repository.findByTokenHash(tokenHash);
        this.ensureAvailable(invite, payload.orgkey, expiresAt, now);

        const affiliation = await repository.findAffiliation(
          username,
          payload.orgkey,
        );

        if (affiliation) {
          throw this.alreadyAffiliated();
        }

        const claimed = await repository.claim(invite.id, now);

        if (claimed.count !== 1) {
          throw new InviteUnavailableException();
        }

        return repository.createMemberAffiliation(username, payload.orgkey);
      });
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw this.alreadyAffiliated();
      }

      throw new InternalException(
        'Falha ao aceitar o convite da organização.',
        error,
      );
    }
  }

  async reject(token: string, username: string) {
    const payload = this.verifyOrUnavailable(token);
    const tokenHash = this.hash(token);
    const expiresAt = DateTime.fromSeconds(payload.exp).toJSDate();
    const now = DateTime.now().toJSDate();

    try {
      return await this.repository.transaction(async (repository) => {
        const invite = await repository.findByTokenHash(tokenHash);
        this.ensureAvailable(invite, payload.orgkey, expiresAt, now);

        const rejected = await repository.markRejected(
          invite.id,
          username,
          now,
        );

        if (rejected.count !== 1) {
          throw new InviteUnavailableException();
        }

        return { rejectedAt: now };
      });
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      throw new InternalException(
        'Falha ao rejeitar o convite da organização.',
        error,
      );
    }
  }

  async revoke(inviteId: string, orgkey: string) {
    const now = DateTime.now().toJSDate();

    try {
      const revoked = await this.repository.revoke(inviteId, orgkey, now);

      if (revoked.count !== 1) {
        throw new InviteUnavailableException();
      }

      return { id: inviteId, revokedAt: now };
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }

      throw new InternalException(
        'Falha ao revogar o convite da organização.',
        error,
      );
    }
  }

  private verifyOrUnavailable(token: string): OrganizationInviteTokenPayload {
    const secret = this.getSecret();

    try {
      return this.verify(token, secret);
    } catch {
      throw new InviteUnavailableException();
    }
  }

  private verify(
    token: string,
    secret: string,
  ): OrganizationInviteTokenPayload {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    });

    if (
      typeof payload === 'string' ||
      typeof payload.orgkey !== 'string' ||
      typeof payload.exp !== 'number' ||
      Object.keys(payload).some((key) => key !== 'orgkey' && key !== 'exp')
    ) {
      throw new InviteUnavailableException();
    }

    return {
      orgkey: payload.orgkey,
      exp: payload.exp,
    };
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getSecret(): string {
    if (!ORGANIZATION_INVITE_SECRET) {
      throw new InternalException(
        'A chave de assinatura dos convites de organização não está configurada.',
      );
    }

    return ORGANIZATION_INVITE_SECRET;
  }

  private unavailablePreview() {
    return {
      valid: false,
      expiresAt: null,
      organization: null,
    };
  }

  private isAvailable(
    invite: {
      orgkey: string;
      expiresAt: Date;
      usedAt: Date | null;
      rejectedAt: Date | null;
      revokedAt: Date | null;
    } | null,
    orgkey: string,
    expiresAt: Date,
    now: Date,
  ): boolean {
    return Boolean(
      invite &&
        invite.orgkey === orgkey &&
        DateTime.fromJSDate(invite.expiresAt).toMillis() === DateTime.fromJSDate(expiresAt).toMillis() &&
        invite.expiresAt > now &&
        !invite.usedAt &&
        !invite.rejectedAt &&
        !invite.revokedAt,
    );
  }

  private ensureAvailable<
    T extends {
      orgkey: string;
      expiresAt: Date;
      usedAt: Date | null;
      rejectedAt: Date | null;
      revokedAt: Date | null;
    },
  >(
    invite: T | null,
    orgkey: string,
    expiresAt: Date,
    now: Date,
  ): asserts invite is T {
    if (!this.isAvailable(invite, orgkey, expiresAt, now)) {
      throw new InviteUnavailableException();
    }
  }

  private alreadyAffiliated(): ConflictException {
    return new ConflictException(
      'O usuário já possui afiliação com esta organização.',
    );
  }
}
