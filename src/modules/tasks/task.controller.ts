import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { TasksRepository } from "@modules/tasks/tasks.repository";
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from "../../security/auth.guard";
import { TaskCreateDTO } from "@modules/tasks/dto/task.create.dto";
import { TaskQueryDTO } from "@modules/tasks/dto/task.query.dto";
import { PermissionGuard } from "@guards/permission.guard";
import { Action } from "@decorators/Action";
import { BaseActions } from "@enums/Actions.enum";
import { Resource } from "@decorators/Resource";
import { Resources } from "@enums/Resources.enum";
import { Role } from "@decorators/Role";
import { OrgRole } from "generated/prisma";
import { CurrentAccount } from '@decorators/CurrentAccount.decorator';
import { CurrentAccountDTO } from '@modules/users/dto/current-account.dto';
import { OrgKey } from '@decorators/OrgKey';
import { EditTaskDTO } from './dto/edit.dto';

@Controller('tasks')
@Resource(Resources.TASKS)
@Role(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.MEMBER)
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TasksController {
  constructor (
    private readonly repository: TasksRepository,
    private readonly service: TasksService,
  ) {}

  @Post()
  @Action(BaseActions.CREATE)
  async create(
    @Body()  data: TaskCreateDTO,
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
      message: 'Nova tarefa adicionada ao projeto.',
      timestamp: new Date().toISOString(),
      path: '/tasks'
    };

    return res.status(response.status).json(response);
  }

  @Get('/:projectkey')
  @Action(BaseActions.SEEK)
  async list(
    @Query() queries: TaskQueryDTO,
    @Param('projectkey') projectkey,
    @Res() res
  ) {
    const result = await this.repository.list({
      ...queries,
      projectkey
    });

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/tasks'
    };
    
    return res.status(response.status).json(response);
  }

  @Get('/:projectkey/:code')
  @Action(BaseActions.SEEK)
  async find(
    @Param('projectkey') projectkey: string,
    @Param('code') code: string,
    @Res() res
  ) {
    const result = await this.repository.find(projectkey, code);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      timestamp: new Date().toISOString(),
      path: `/tasks/${projectkey}/${code}`
    };

    return res.status(response.status).json(response);
  }

  @Put('/:projectkey/:code')
  @Action(BaseActions.EDIT)
  async update(
    @Param('projectkey') projectkey: string,
    @Param('code') code: string,
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
    @Body() update: EditTaskDTO,
    @Res() res
  ) {
    const result = await this.service.edit(projectkey, code, update, {
      orgkey,
      actorkey: account.username,
    });

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Tarefa atualizada com sucesso.',
      timestamp: new Date().toISOString(),
      path: `/tasks/${projectkey}/${code}`
    };

    return res.status(response.status).json(response);
  }

  @Delete('/del/:id')
  @Action(BaseActions.DEL)
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
      message: 'Tarefa excluída com sucesso.',
      timestamp: new Date().toISOString(),
      path: `/tasks/del/${id}`
    };

    return res.status(response.status).json(response);
  }
}
