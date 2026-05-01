import { ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { TasksRepository } from "@modules/tasks/tasks.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { TaskCreateDTO } from "@modules/tasks/dto/task.create.dto";
import { TaskQueryDTO } from "@modules/tasks/dto/task.query.dto";

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor (
    private readonly repository: TasksRepository
  ) {}

  @Post()
  async create(
    @Body()  data: TaskCreateDTO,
    @Res() response
  ) {
    const result = await this.repository.create(data); 
    
    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'New task added to project',
      
      timestamp: new Date().toISOString(),
      path: '/tasks'
    };

    return response.status(resp.status).json(resp);
  }

  @Get('/:projectkey')
  async list(
    @Query() queries: TaskQueryDTO,
    @Param('projectkey') projectkey,
    @Res() response
  ) {
    const result = await this.repository.list({
      ...queries,
      projectkey
    });

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/tasks'
    };
    
    return response.status(resp.status).json(resp);
  }

  @Get('/:code')
  async find(
    @Param('code') code: string
  ) {
    return await this.repository.find(code);
  }

  @Put('/:code')
  async update(
    @Param('code') code: string,
    @Body()        update: any
  ) {
    return await this.repository.edit(code, update);
  }

  @Delete('/del/:id')
  async delete(
    @Param('id') id: string,
  ) {
    return await this.repository.delete(id);
  }
}