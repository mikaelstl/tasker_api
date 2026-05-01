import { ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { EventsRepository } from "./events.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { EventCreateDTO } from "@modules/events/dto/event.create.dto";
import { EventQueryDTO } from "@modules/events/dto/event.query.dto";

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor (
    private readonly repository: EventsRepository
  ) {}

  @Post()
  async create(
    @Body()  data: EventCreateDTO,
    @Res() response
  ) {
    const result = await this.repository.create(data); 
    
    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'New task added to project',
      
      timestamp: new Date().toISOString(),
      path: '/events'
    };

    return response.status(resp.status).json(resp);
  }

  @Get()
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