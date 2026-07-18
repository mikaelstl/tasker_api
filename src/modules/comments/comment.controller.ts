import { ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { CommentsRepository } from "./comments.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { CreateCommentDTO } from "@modules/comments/dto/comment.create.dto";
import { CommentQueryDTO } from "@modules/comments/dto/comment.query.dto";
import { PermissionGuard } from "@guards/permission.guard";
import { BaseActions } from "@enums/Actions.enum";
import { Action } from "@decorators/Action";
import { Resource } from "@decorators/Resource";
import { Resources } from "@enums/Resources.enum";

@Controller('comments')
@Resource(Resources.COMMENTS)
@UseGuards(JwtAuthGuard,PermissionGuard)
export class CommentsController {
  constructor (
    private readonly repository: CommentsRepository
  ) {}

  @Post()
  @Action(BaseActions.CREATE)
  async create(
    @Body() data: CreateCommentDTO,
    @Res() response
  ) {
    const result = await this.repository.create(data); 
    
    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Novo comentário adicionado ao projeto.',
      
      timestamp: new Date().toISOString(),
      path: '/comments'
    };

    return response.status(resp.status).json(resp);
  }

  @Get()
  @Action(BaseActions.SEEK)
  async list(
    @Query() queries: CommentQueryDTO,
    @Res() response
  ) {
    const result = await this.repository.list(queries);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/comments'
    };
    
    return response.status(resp.status).json(resp);
  }

  @Get('/:id')
  @Action(BaseActions.SEEK)
  async find(
    @Param('id') id: string,
    @Res() response
  ) {
    const result = await this.repository.find(id);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/comments'
    };
    
    return response.status(resp.status).json(resp);
  }

  @Delete('/del/:id')
  @Action(BaseActions.DEL)
  async delete(
    @Param('id') id: string,
    @Res() response
  ) {
    const result = await this.repository.delete(id);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Comentário excluído com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/comments'
    };
    
    return response.status(resp.status).json(resp);
  }
}
