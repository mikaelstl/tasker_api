import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "@security/auth.guard";
import { PermissionGuard } from "@guards/permission.guard";
import { CurrentAccount } from "@decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { DefineAffiliationDTO } from "@modules/affiliations/dto/define.dto";
import { AffiliationService } from "./affiliations.service";
import { Action } from "@decorators/Action";
import { BaseActions, EnhancedActions } from "@enums/Actions.enum";
import { Role } from "@decorators/Role";
import { OrgRole } from "generated/prisma";
import { Resource } from "@decorators/Resource";
import { Resources } from "@enums/Resources.enum";
import { OrgKey } from '@decorators/OrgKey';

@Controller('affiliations')
@Resource(Resources.AFFILIATIONS)
@UseGuards(JwtAuthGuard)
export class AffiliationController {
  constructor(
    private readonly service: AffiliationService,
  ) {}

  @Post()
  @Role(OrgRole.OWNER)
  @Action(BaseActions.CREATE)
  @UseGuards(PermissionGuard)
  async create(
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
    @Body() data: DefineAffiliationDTO,
    @Res() res
  ) {
    const result = await this.service.create({
      ...data,
      orgkey,
    }, account.username);
    
    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Afiliação adicionada com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/affiliations'
    };

    return res.status(response.status).json(response);
  }

  @Get()
  @Action(BaseActions.SEEK)
  async list(
    @CurrentAccount() account: CurrentAccountDTO,
    @Res() res
  ) {
    const result = await this.service.getUserOrganizations(account.username);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Organizações do usuário encontradas.',
      timestamp: new Date().toISOString(),
      path: '/affiliations'
    };

    return res.status(response.status).json(response);
  }

  @Get('/participates/:orgkey')
  @Action(BaseActions.SEEK)
  @Role(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.MEMBER)
  @UseGuards(PermissionGuard)
  async participates(
    @Param('orgkey') orgkey: string,
    @CurrentAccount() account: CurrentAccountDTO,
    @Res() res
  ) {
    const result = await this.service.participates(account.username, orgkey);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: result
        ? 'O usuário participa da organização.'
        : 'O usuário não participa da organização.',
      timestamp: new Date().toISOString(),
      path: `/affiliations/participates/${orgkey}`
    };

    return res.status(response.status).json(response);
  }

  @Get('/find')
  @Action(BaseActions.SEEK)
  async find(
    @Query('userkey') userkey: string,
    @OrgKey() orgkey: string,
    @Res() res
  ) {
    const result = await this.service.findByUserAndOrgkey(userkey, orgkey);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Afiliação encontrada com sucesso.',
      timestamp: new Date().toISOString(),
      path: '/affiliations/find'
    };

    return res.status(response.status).json(response);
  }

  @Get('/:orgkey')
  @Action(BaseActions.SEEK)
  async listByOrganization(
    @Param('orgkey') orgkey: string,
    @CurrentAccount() account: CurrentAccountDTO,
    @Res() res
  ) {
    const result = await this.service.getOrganizationAffiliations(
      orgkey,
      account.username,
    );

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Afiliações da organização encontradas.',
      timestamp: new Date().toISOString(),
      path: `/affiliations/${orgkey}`
    };

    return res.status(response.status).json(response);
  }

  @Delete('/remove/:id')
  @Role(OrgRole.OWNER)
  @Action(BaseActions.DEL)
  @UseGuards(PermissionGuard)
  async delete(
    @Param('id') id: string,
    @OrgKey() orgkey: string,
    @Res() res,
    @CurrentAccount() account: CurrentAccountDTO,
  ){
    const result = await this.service.delete(id, {
      orgkey,
      actorkey: account.username,
    });
    
    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: null,
      message: `Afiliação removida com sucesso.`,
      
      timestamp: new Date().toISOString(),
      path: '/affiliations/del'
    };

    return res.status(response.status).json(response);
  }

  @Patch('/promote/:id')
  @Role(OrgRole.OWNER)
  @Action(EnhancedActions.PROMOTE)
  @UseGuards(PermissionGuard)
  async promote(
    @Param('id') id: string,
    @OrgKey() orgkey: string,
    @Res() res,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.service.promote(id, {
      orgkey,
      actorkey: account.username,
    });

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/affiliations/promote'
    };

    return res.status(response.status).json(response);
  }

  @Patch('/demote/:id')
  @Role(OrgRole.OWNER)
  @Action(EnhancedActions.DEMOTE)
  @UseGuards(PermissionGuard)
  async demote(
    @Param('id') id: string,
    @OrgKey() orgkey: string,
    @Res() res,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.service.demote(id, {
      orgkey,
      actorkey: account.username,
    });

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/affiliations/demote'
    };

    return res.status(response.status).json(response);
  }

  @Patch('/:id/ownership/transfer')
  @Role(OrgRole.OWNER)
  @Action(BaseActions.EDIT)
  @UseGuards(PermissionGuard)
  async transferOwnership(
    @Param('id') id: string,
    @OrgKey() orgkey: string,
    @CurrentAccount() account: CurrentAccountDTO,
    @Res() res,
  ) {
    const result = await this.service.transferOwnership(id, {
      orgkey,
      actorkey: account.username,
    });

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Propriedade da organização transferida com sucesso.',
      timestamp: new Date().toISOString(),
      path: `/affiliations/${id}/ownership/transfer`,
    };

    return res.status(response.status).json(response);
  }
}
