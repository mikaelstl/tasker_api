import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { RateLimitException } from 'src/common/errors/rate-limit.exception';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class OrganizationInviteRateLimitGuard implements CanActivate {
  private readonly requests = new Map<string, RateLimitEntry>();
  private readonly windowMs = 60_000;
  private readonly maxRequests = 30;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const now = Date.now();
    const key = `${request.ip ?? request.socket.remoteAddress ?? 'unknown'}:${request.path}`;
    const current = this.requests.get(key);

    if (!current || current.resetAt <= now) {
      this.requests.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      this.removeExpiredEntries(now);
      return true;
    }

    if (current.count >= this.maxRequests) {
      throw new RateLimitException();
    }

    current.count += 1;
    return true;
  }

  private removeExpiredEntries(now: number): void {
    for (const [key, entry] of this.requests) {
      if (entry.resetAt <= now) {
        this.requests.delete(key);
      }
    }
  }
}
