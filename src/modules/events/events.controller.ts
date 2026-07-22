import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
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
import { EventsService } from './events.service';
import { CurrentAccount } from '@decorators/CurrentAccount.decorator';
import { CurrentAccountDTO } from '@modules/users/dto/current-account.dto';
import { OrgKey } from '@decorators/OrgKey';

@Controller('events')
@Resource(Resources.EVENTS)
@UseGuards(JwtAuthGuard, PermissionGuard)
export class EventsController {
  constructor (
    private readonly repository: EventsRepository,
    private readonly service: EventsService,
  ) {}

  @Post()
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  @Action(BaseActions.CREATE)
  async create(
    @Body()  data: EventCreateDTO,
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
    @Res() res
  ) {
    const result = await this.service.create(data, {
      orgkey,
      actorkey: account.username,
    });
    
    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Novo evento adicionado ao projeto.',
      
      timestamp: new Date().toISOString(),
      path: '/events'
    };

    return res.status(response.status).json(response);
  }

  @Get()
  @Action(BaseActions.SEEK)
  @Role(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.MEMBER)
  async list(
    @Query() queries: EventQueryDTO,
    @Res() res
  ) {
    const result = await this.repository.list(queries);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/events'
    };
    
    return res.status(response.status).json(response);
  }

  @Get('/:code')
  @Action(BaseActions.SEEK)
  async find(
    @Param('code') code: string,
    @Res() res
  ) {
    const result = await this.repository.find(code);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      timestamp: new Date().toISOString(),
      path: `/events/${code}`
    };

    return res.status(response.status).json(response);
  }

  @Put('/:code')
  @Action(BaseActions.EDIT)
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  async update(
    @Param('code') code: string,
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
    @Body() update: any,
    @Res() res
  ) {
    const result = await this.service.edit(code, update, {
      orgkey,
      actorkey: account.username,
    });

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Evento atualizado com sucesso.',
      timestamp: new Date().toISOString(),
      path: `/events/${code}`
    };

    return res.status(response.status).json(response);
  }

  @Delete('/:id')
  @Action(BaseActions.DEL)
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  async delete(
    @Param('id') id: string,
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
    @Res() res
  ) {
    const result = await this.service.delete(id, {
      orgkey,
      actorkey: account.username,
    });

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Evento excluído com sucesso.',
      timestamp: new Date().toISOString(),
      path: `/events/${id}`
    };

    return res.status(response.status).json(response);
  }
}
