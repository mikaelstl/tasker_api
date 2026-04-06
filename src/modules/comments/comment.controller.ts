import { ApiResponse } from "@interfaces/response";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { CommentsRepository } from "./comments.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { CreateCommentDTO } from "@modules/comments/dto/comment.create.dto";
import { CommentQueryDTO } from "@modules/comments/dto/comment.query.dto";

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor (
    private readonly repository: CommentsRepository
  ) {}

  @Post()
  async create(
    @Body()  data: CreateCommentDTO,
    @Res() response
  ) {
    const result = await this.repository.create(data); 
    
    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'New comment added to project',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/comments'
    };

    return response.status(resp.status).json(resp);
  }

  @Get()
  async list(
    @Query() queries: CommentQueryDTO,
    @Res() response
  ) {
    const result = await this.repository.list(queries);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/comments'
    };
    
    return response.status(resp.status).json(resp);
  }

  @Get('/:id')
  async find(
    @Param('id') id: string,
    @Res() response
  ) {
    const result = await this.repository.find(id);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/comments'
    };
    
    return response.status(resp.status).json(resp);
  }

  @Delete('/:id')
  async delete(
    @Param('id') id: string,
    @Res() response
  ) {
    const result = await this.repository.delete(id);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Comment deleted with success',
      error: false,
      timestamp: new Date().toISOString(),
      path: '/comments'
    };
    
    return response.status(resp.status).json(resp);
  }
}