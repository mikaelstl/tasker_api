import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { CheckpointsRepository } from "@repositories/checkpoints.repository";
import { TasksRepository } from "@repositories/tasks.repository";
import { CheckpointCreateDTO } from "src/DTO/checkpoint/checkpoint.create.dto";
import { TaskCreateDTO } from "src/DTO/task/task.create.dto";
import { TaskQueryDTO } from "src/DTO/task/task.query.dto";

@Controller('checkpoints')
export class CheckpointsController {
  constructor (
    private readonly repository: CheckpointsRepository
  ) {}

  @Post()
  async create(
    @Body()  data: CheckpointCreateDTO
  ) {
    return await this.repository.create(data);
  }

  @Get()
  async list(
    @Query() queries: TaskQueryDTO
  ) {
    console.log(queries);
    
    return await this.repository.list(queries);
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