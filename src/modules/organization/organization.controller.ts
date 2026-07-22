import { Body, Controller, Delete, HttpStatus, Param, Post, Req, Res, UseGuards, } from "@nestjs/common";
import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
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
    private readonly service: OrganizationService,
  ) { }

  @Post()
  async create(
    @CurrentAccount() account: CurrentAccountDTO,
    @Body() data: OrganizationCreateDTO,
    @Res() res
  ) {
    const result: OrganizationDTO = await this.service.create({
      name: data.name,
      ownerkey: account.username
    });

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Organização criada com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/org'
    };

    return res.status(response.status).json(response);
  }

  @Delete('/del/:id')
  @Role(OrgRole.OWNER)
  @Action(BaseActions.DEL)
  @UseGuards(PermissionGuard)
  async delete(
    @Param('id') id: string,
    @CurrentAccount() account: CurrentAccountDTO,
    @Res() res
  ) {
    const result: OrganizationDTO = await this.service.delete(id, {
      orgkey: id,
      actorkey: account.username,
    });

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Organização excluída com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/org/del'
    };

    return res.status(response.status).json(response);
  }
}
