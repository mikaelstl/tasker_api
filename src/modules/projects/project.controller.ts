import { ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, Get, Header, Headers, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { MembersRepository } from "../members/member.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { ProjectService } from "@modules/projects/project.service";
import { CreateProjectDTO } from "@modules/projects/dto/project.create.dto";
import { ProjectQueryDTO } from "@modules/projects/dto/project.query.dto";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { PermissionGuard } from "@guards/permission.guard";
import { OrgRole } from "generated/prisma";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { EditProjectDTO } from "@modules/projects/dto/edit.dto";
import { Resources } from "src/common/enums/Resources.enum";
import { Resource } from "@decorators/Resource";
import { Role } from "@decorators/Role";
import { OrgKey } from "@decorators/OrgKey";
import { Action } from "@decorators/Action";
import { Actions } from "src/common/enums/Actions.enum";

@Controller('project')
@UseGuards(JwtAuthGuard)
@Resource(Resources.PROJECTS)
export class ProjectController {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly service: ProjectService,
  ) {}

  @Post()
  @Action(Actions.CREATE)
  @Role(OrgRole.OWNER)
  @UseGuards(PermissionGuard)
  async create(
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
    @Body() data: CreateProjectDTO,
    @Res() response
  ) {
    const result = await this.service.create({
      ...data,
      ownerkey: orgkey
    }); 
    
    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'New project created with success',
      
      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return response.status(resp.status).json(resp);
  }

  @Get('/list')
  async list(
    @Query()  queries: ProjectQueryDTO,
    @OrgKey() orgkey: string,
    @Res()    response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.repository.list({ ownerkey: orgkey });
    
    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/project/list'
    };

    return response.status(resp.status).json(resp);
  }

  @Get('/:id')
  @UseGuards(PermissionGuard)
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
      
      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return response.status(resp.status).json(resp);
  }

  @Put('/:id')
  @UseGuards(PermissionGuard)
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
      
      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return response.status(resp.status).json(resp);
  }

  @Delete('/del/:id')
  @UseGuards(PermissionGuard)
  @Role(OrgRole.OWNER)
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
      
      timestamp: new Date().toISOString(),
      path: '/project/del'
    };

    return response.status(resp.status).json(resp);
  }
}