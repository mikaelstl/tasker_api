import { Body, Controller, Delete, HttpStatus, Param, Post, Req, Res, UseGuards, } from "@nestjs/common";
import { OrganizationRepository } from "./organization.repository";
import { ApiResponse } from "src/common/interfaces/ApiResponse";
import { OrganizationService } from "./organization.service";
import { OrganizationDTO } from "@modules/organization/dto/organization.dto";
import { OrganizationCreateDTO } from "@modules/organization/dto/create.dto";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { JwtAuthGuard } from "@security/auth.guard";
import { PermissionGuard } from "@guards/permission.guard";
import { Resources } from "@enums/Resources.enum";
import { Resource } from "@decorators/Resource";
import { Action } from "@decorators/Action";
import { BaseActions } from "@enums/Actions.enum";
import { Role } from "@decorators/Role";
import { OrgRole } from "generated/prisma";

@Controller('org')
@Resource(Resources.ORGANIZATIONS)
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(
    private readonly repository: OrganizationRepository,
    private readonly service: OrganizationService,
  ) { }

  @Post()
  async create(
    @CurrentAccount() account: CurrentAccountDTO,
    @Body() data: OrganizationCreateDTO,
    @Res() resp
  ) {
    console.log(account);

    const result: OrganizationDTO = await this.service.create({
      name: data.name,
      ownerkey: account.username
    });

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Organization created with success',
      
      timestamp: new Date().toISOString(),
      path: '/org'
    };

    return resp.status(response.status).json(response);
  }

  @Delete('/del/:id')
  @Role(OrgRole.OWNER)
  @Action(BaseActions.DEL)
  @UseGuards(PermissionGuard)
  async delete(
    @Param('id') id: string,
    @Res() resp
  ) {
    const result: OrganizationDTO = await this.repository.delete(id);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Organization delete',
      
      timestamp: new Date().toISOString(),
      path: '/org/del'
    };

    return resp.status(response.status).json(response);
  }
}