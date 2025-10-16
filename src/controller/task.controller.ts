import { ApiResponse } from "@interfaces/response";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { TasksRepository } from "@repositories/tasks.repository";
import { JwtAuthGuard } from "@services/auth/auth.guard";
import { TaskCreateDTO } from "src/DTO/task.create.dto";
import { TaskListDTO } from "src/DTO/task.dto";

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor (
    private readonly repository: TasksRepository
  ) {}

  @Post()
  async create(
    @Body()  data: TaskCreateDTO
  ) {
    return await this.repository.create(data);
  }

  @Get()
  async list(
    @Query() queries: TaskListDTO,
    @Res() response
  ) {
    console.log(queries);
    const result = await this.repository.list(queries);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      error: false,
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

  @Delete('/:id')
  async delete(
    @Param('id') id: string,
  ) {
    return await this.repository.delete(id);
  }
}