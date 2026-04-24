import { Body, Controller, Delete, HttpStatus, Param, Post, Req, Res, UseGuards, } from "@nestjs/common";
import { OrganizationRepository } from "./organization.repository";
import { ApiResponse } from "@interfaces/ApiResponse";
import { OrganizationService } from "./organization.service";
import { OrganizationDTO } from "@modules/organization/dto/organization.dto";
import { OrganizationCreateDTO } from "@modules/organization/dto/create.dto";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { JwtAuthGuard } from "@security/auth.guard";

@Controller('org')
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