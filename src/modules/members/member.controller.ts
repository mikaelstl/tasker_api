import { ApiResponse } from "@interfaces/ApiResponse";
import { Body, Controller, Delete, Get, Headers, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { MembersRepository } from "./member.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { PermissionGuard } from "@guards/permission.guard";
import { OrgRole } from "generated/prisma";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { DefineMemberDTO } from "@modules/members/dto/member.create.dto";

@Controller('members')
@UseGuards(JwtAuthGuard, PermissionGuard)
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
      
      timestamp: new Date().toISOString(),
      path: '/members/del'
    };

    return response.status(resp.status).json(resp);
  }
}