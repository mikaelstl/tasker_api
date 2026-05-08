import { ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, HttpStatus, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "@security/auth.guard";
import { PermissionGuard } from "@guards/permission.guard";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { DefineAffiliationDTO } from "@modules/affiliations/dto/define.dto";
import { AffiliationService } from "./affiliations.service";
import { Action } from "@decorators/Action";
import { BaseActions, EnhancedActions } from "@enums/Actions.enum";
import { Role } from "@decorators/Role";
import { OrgRole } from "generated/prisma";
import { Resource } from "@decorators/Resource";
import { Resources } from "@enums/Resources.enum";

@Controller('affiliations')
@Resource(Resources.AFFILIATIONS)
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AffiliationController {
  constructor(
    private readonly service: AffiliationService,
  ) {}

  @Post()
  @Role(OrgRole.OWNER)
  @Action(BaseActions.CREATE)
  async create(
    @CurrentAccount() account: CurrentAccountDTO,
    @Body() data: DefineAffiliationDTO,
    @Res() response
  ) {
    const result = await this.service.create(data); 
    
    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Affiliation added.',
      
      timestamp: new Date().toISOString(),
      path: '/affiliations'
    };

    return response.status(resp.status).json(resp);
  }

  @Delete('/remove/:id')
  @Role(OrgRole.OWNER)
  @Action(BaseActions.DEL)
  async delete(
    @Param('id') id: string,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ){
    const result = await this.service.delete(id);
    
    const resp: ApiResponse = {
      status: HttpStatus.NO_CONTENT,
      data: null,
      message: `Affiliation removed.`,
      
      timestamp: new Date().toISOString(),
      path: '/affiliations/del'
    };

    return response.status(resp.status).json(resp);
  }

  @Patch('/promote/:id')
  @Role(OrgRole.OWNER)
  @Action(EnhancedActions.PROMOTE)
  async promote(
    @Param('id') id: string,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.service.promote(id);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/affiliations/promote'
    };

    return response.status(resp.status).json(resp);
  }

  @Patch('/demote/:id')
  @Role(OrgRole.OWNER)
  @Action(EnhancedActions.DEMOTE)
  async demote(
    @Param('id') id: string,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.service.demote(id);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/affiliations/demote'
    };

    return response.status(resp.status).json(resp);
  }
}