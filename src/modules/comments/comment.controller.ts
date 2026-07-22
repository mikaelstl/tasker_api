import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
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
import { Role } from "@decorators/Role";
import { OrgRole } from "generated/prisma";
import { CommentsService } from './comments.service';
import { CurrentAccount } from '@decorators/CurrentAccount.decorator';
import { CurrentAccountDTO } from '@modules/users/dto/current-account.dto';
import { OrgKey } from '@decorators/OrgKey';

@Controller('comments')
@Resource(Resources.COMMENTS)
@Role(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.MEMBER)
@UseGuards(JwtAuthGuard,PermissionGuard)
export class CommentsController {
  constructor (
    private readonly repository: CommentsRepository,
    private readonly service: CommentsService,
  ) {}

  @Post()
  @Action(BaseActions.CREATE)
  async create(
    @Body() data: CreateCommentDTO,
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
      message: 'Novo comentário adicionado ao projeto.',
      
      timestamp: new Date().toISOString(),
      path: '/comments'
    };

    return res.status(response.status).json(response);
  }

  @Get()
  @Action(BaseActions.SEEK)
  async list(
    @Query() queries: CommentQueryDTO,
    @Res() res
  ) {
    const result = await this.repository.list(queries);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/comments'
    };
    
    return res.status(response.status).json(response);
  }

  @Get('/:id')
  @Action(BaseActions.SEEK)
  async find(
    @Param('id') id: string,
    @Res() res
  ) {
    const result = await this.repository.find(id);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/comments'
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
      message: 'Comentário excluído com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/comments'
    };
    
    return res.status(response.status).json(response);
  }
}
