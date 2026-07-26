import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Action } from '@decorators/Action';
import { CurrentAccount } from '@decorators/CurrentAccount.decorator';
import { OrgKey } from '@decorators/OrgKey';
import { Resource } from '@decorators/Resource';
import { Role } from '@decorators/Role';
import { BaseActions } from '@enums/Actions.enum';
import { Resources } from '@enums/Resources.enum';
import { PermissionGuard } from '@guards/permission.guard';
import { CurrentAccountDTO } from '@modules/users/dto/current-account.dto';
import { JwtAuthGuard } from '@security/auth.guard';
import { OrgRole } from 'generated/prisma';
import { ApiResponse } from 'src/common/interfaces/ApiResponse';
import { OrganizationInviteTokenDTO } from './dto/organization-invite-token.dto';
import { RevokeOrganizationInviteDTO } from './dto/revoke-organization-invite.dto';
import { OrganizationInviteRateLimitGuard } from './organization-invite-rate-limit.guard';
import { OrganizationInviteService } from './organization-invite.service';

@Controller('org/invites')
export class OrganizationInviteController {
  constructor(private readonly service: OrganizationInviteService) {}

  @Post()
  @Resource(Resources.AFFILIATIONS)
  @Role(OrgRole.OWNER)
  @Action(BaseActions.CREATE)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  async create(
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
    @Res() res,
  ) {
    const result = await this.service.create(orgkey, account.username);
    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      message: 'Convite criado com sucesso.',
      data: result,
      path: '/org/invites',
      timestamp: new Date().toISOString(),
    };

    return res.status(response.status).json(response);
  }

  @Post('preview')
  @UseGuards(OrganizationInviteRateLimitGuard)
  async preview(@Body() data: OrganizationInviteTokenDTO, @Res() res) {
    const result = await this.service.preview(data.token);
    const response: ApiResponse = {
      status: HttpStatus.OK,
      message: result.valid
        ? 'Convite disponível.'
        : 'Convite inválido ou indisponível.',
      data: result,
      path: '/org/invites/preview',
      timestamp: new Date().toISOString(),
    };

    return res.status(response.status).json(response);
  }

  @Post('accept')
  @UseGuards(OrganizationInviteRateLimitGuard, JwtAuthGuard)
  async accept(
    @Body() data: OrganizationInviteTokenDTO,
    @CurrentAccount() account: CurrentAccountDTO,
    @Res() res,
  ) {
    const result = await this.service.accept(data.token, account.username);
    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      message: 'Convite aceito com sucesso.',
      data: result,
      path: '/org/invites/accept',
      timestamp: new Date().toISOString(),
    };

    return res.status(response.status).json(response);
  }

  @Post('reject')
  @UseGuards(OrganizationInviteRateLimitGuard, JwtAuthGuard)
  async reject(
    @Body() data: OrganizationInviteTokenDTO,
    @CurrentAccount() account: CurrentAccountDTO,
    @Res() res,
  ) {
    const result = await this.service.reject(data.token, account.username);
    const response: ApiResponse = {
      status: HttpStatus.OK,
      message: 'Convite rejeitado com sucesso.',
      data: result,
      path: '/org/invites/reject',
      timestamp: new Date().toISOString(),
    };

    return res.status(response.status).json(response);
  }

  @Post('revoke')
  @Resource(Resources.AFFILIATIONS)
  @Role(OrgRole.OWNER)
  @Action(BaseActions.DEL)
  @UseGuards(JwtAuthGuard, PermissionGuard)
  async revoke(
    @Body() data: RevokeOrganizationInviteDTO,
    @OrgKey() orgkey: string,
    @Res() res,
  ) {
    const result = await this.service.revoke(data.inviteId, orgkey);
    const response: ApiResponse = {
      status: HttpStatus.OK,
      message: 'Convite revogado com sucesso.',
      data: result,
      path: '/org/invites/revoke',
      timestamp: new Date().toISOString(),
    };

    return res.status(response.status).json(response);
  }
}
