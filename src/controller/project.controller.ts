import { ApiResponse } from "@interfaces/response";
import { Body, Controller, Delete, Get, Headers, HttpStatus, Param, Post, Query, Res, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "@services/auth/auth.guard";
import { ProjectService } from "@services/project.service";
import { CreateProjectDTO } from "src/DTO/project.create.dto";
import { ProjectRepository } from "src/repositories/projects.repository";

@Controller('project')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly service: ProjectService
  ) {}

  @Post()
  async create(
    @Body()   data: CreateProjectDTO,
    @Res() response
    // @Headers('user') user: string
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
    @Res() response,
    @Headers('user') user: string
  ) {
    const result = await this.repository.list(user);
    
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

  @Get()
  async find(
    @Query() query: any,
    @Res() response,
  ) {
    const result = await this.repository.find(query.id);
    
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

  @Delete('/del/:id')
  async delete(
    @Param('id') id: string,
    @Res() response,
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

  @Get('/status')
  async status() {
    return { status: 'OK' }
  }
}