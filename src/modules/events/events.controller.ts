import { ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { EventsRepository } from "./events.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { EventCreateDTO } from "@modules/events/dto/event.create.dto";
import { EventQueryDTO } from "@modules/events/dto/event.query.dto";
import { Action } from "@decorators/Action";
import { BaseActions } from "@enums/Actions.enum";
import { PermissionGuard } from "@guards/permission.guard";
import { Resources } from "@enums/Resources.enum";
import { Resource } from "@decorators/Resource";
import { Role } from "@decorators/Role";
import { OrgRole } from "generated/prisma";

@Controller('events')
@Resource(Resources.EVENTS)
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EventsController {
  constructor (
    private readonly repository: EventsRepository
  ) {}

  @Post()
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  @Action(BaseActions.CREATE)
  async create(
    @Body()  data: EventCreateDTO,
    @Res() response
  ) {
    const result = await this.repository.create(data); 
    
    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Novo evento adicionado ao projeto.',
      
      timestamp: new Date().toISOString(),
      path: '/events'
    };

    return response.status(resp.status).json(resp);
  }

  @Get()
  @Action(BaseActions.SEEK)
  @Role(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.MEMBER)
  async list(
    @Query() queries: EventQueryDTO,
    @Res() response
  ) {
    const result = await this.repository.list(queries);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/events'
    };
    
    return response.status(resp.status).json(resp);
  }

  @Get('/:code')
  @Action(BaseActions.SEEK)
  async find(
    @Param('code') code: string
  ) {
    return await this.repository.find(code);
  }

  @Put('/:code')
  @Action(BaseActions.EDIT)
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  async update(
    @Param('code') code: string,
    @Body()        update: any
  ) {
    return await this.repository.edit(code, update);
  }

  @Delete('/:id')
  @Action(BaseActions.DEL)
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  async delete(
    @Param('id') id: string,
  ) {
    return await this.repository.delete(id);
  }
}
