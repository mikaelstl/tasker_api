import { Body, Controller, Delete, HttpStatus, Param, Post, Req, Res, UseGuards, } from "@nestjs/common";
import { OrganizationRepository } from "./organization.repository";
import { ApiResponse } from "@interfaces/response";
import { OrganizationService } from "./organization.service";
import { RolesGuard } from "src/guards/roles.guard";
import { Roles } from "src/decorators/Roles";
import { AccountRole } from "generated/prisma";
import { OrganizationDTO } from "src/DTO/organization/organization.dto";
import { OrganizationCreateDTO } from "../../DTO/organization/create.dto";
import { AuthService } from "src/security/auth.service";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "src/DTO/user/current-account.dto";
import { JwtAuthGuard } from "src/security/auth.guard";

@Controller('org')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.ORGANIZER)
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

    const result: OrganizationDTO = await this.repository.create({
      name: data.name,
      ownerkey: account.username
    });

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Registered with success',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/org'
    };

    return resp.status(response.status).json(response);
  }

  @Delete('del/:id')
  async delete(
    @Param('id') id: string,
    @Res() resp
  ) {
    const result: OrganizationDTO = await this.repository.delete(id);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Organization delete',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/org/del'
    };

    return resp.status(response.status).json(response);
  }
}