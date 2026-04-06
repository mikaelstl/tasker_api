import { ApiResponse } from "@interfaces/response";
import { Body, Controller, Delete, Get, Headers, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { MembersRepository } from "./member.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { RolesGuard } from "src/guards/roles.guard";
import { Roles } from "src/decorators/Roles";
import { AccountRole } from "generated/prisma";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { DefineMemberDTO } from "src/DTO/member/member.create.dto";

@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AccountRole.ORGANIZER, AccountRole.MANAGER)
export class MemberController {
  constructor(
    private readonly repository: MembersRepository,
  ) {}

  @Post()
  async create(
    @CurrentAccount() account: CurrentAccountDTO,
    @Body() data: DefineMemberDTO,
    @Res() response
  ) {
    const result = await this.repository.create(data); 
    
    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Member added.',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/members'
    };

    return response.status(resp.status).json(resp);
  }

  @Get(':projectkey')
  async list(
    @Param()  projectkey: string,
    @Res()    response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.repository.list(projectkey);
    
    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/members'
    };

    return response.status(resp.status).json(resp);
  }

  @Delete('/del/:id')
  async delete(
    @Param('id') id: string,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ){
    const result = await this.repository.delete(id);
    
    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: `Member removed.`,
      error: false,
      timestamp: new Date().toISOString(),
      path: '/members/del'
    };

    return response.status(resp.status).json(resp);
  }
}