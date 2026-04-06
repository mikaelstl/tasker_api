import { ApiResponse } from "@interfaces/response";
import { Body, Controller, Delete, Get, Headers, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { MembersRepository } from "../members/member.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { ProjectService } from "@modules/projects/project.service";
import { CreateProjectDTO } from "@modules/projects/dto/project.create.dto";
import { ProjectQueryDTO } from "@modules/projects/dto/project.query.dto";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { RolesGuard } from "src/guards/roles.guard";
import { Roles } from "src/decorators/Roles";
import { AccountRole } from "generated/prisma";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { EditProjectDTO } from "@modules/projects/dto/edit.dto";

@Controller('project')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly memberRepository: MembersRepository,
    private readonly service: ProjectService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ORGANIZER)
  async create(
    @CurrentAccount() account: CurrentAccountDTO,
    @Body() data: CreateProjectDTO,
    @Res() response
  ) {
    const result = await this.service.create(data); 
    
    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'New project created with success',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return response.status(resp.status).json(resp);
  }

  @Get('/list')
  async list(
    @Query()  queries: ProjectQueryDTO,
    @Res()    response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.service.list(account);
    
    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/project/list'
    };

    return response.status(resp.status).json(resp);
  }

  @Get('/:id')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ORGANIZER)
  async find(
    @Param('id') id: string,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.repository.find(id);
    
    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return response.status(resp.status).json(resp);
  }

  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ORGANIZER)
  async edit(
    @Param('id') id: string,
    @Body() data: EditProjectDTO,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.repository.edit(id, data);
    
    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Updated with success',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return response.status(resp.status).json(resp);
  }

  @Delete('/del/:id')
  @UseGuards(RolesGuard)
  @Roles(AccountRole.ORGANIZER)
  async delete(
    @Param('id') id: string,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ){
    const result = await this.repository.delete(id);
    
    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: `Project delete with success`,
      error: false,
      timestamp: new Date().toISOString(),
      path: '/project/del'
    };

    return response.status(resp.status).json(resp);
  }

  @Get('/:id/members')
  async getMembers(
    @Param('id') id: string,
    @Res() response,
  ) {
    const result = await this.memberRepository.list(id);
    
    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/project/members'
    };

    return response.status(resp.status).json(resp);
  }
}