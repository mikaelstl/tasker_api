import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Res, UseGuards } from "@nestjs/common";
import { MembersRepository } from "./member.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { PermissionGuard } from "@guards/permission.guard";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { DefineMemberDTO } from "@modules/members/dto/member.create.dto";
import { Resource } from "@decorators/Resource";
import { Resources } from "@enums/Resources.enum";
import { Action } from "@decorators/Action";
import { BaseActions } from "@enums/Actions.enum";
import { OrgRole } from "generated/prisma";
import { Role } from "@decorators/Role";
import { MembersService } from './members.service';
import { OrgKey } from '@decorators/OrgKey';

@Controller('members')
@Resource(Resources.MEMBERS)
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MemberController {
  constructor(
    private readonly repository: MembersRepository,
    private readonly service: MembersService,
  ) {}

  @Post()
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  @Action(BaseActions.CREATE)
  async create(
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
    @Body() data: DefineMemberDTO,
    @Res() res
  ) {
    const result = await this.service.create(data, {
      orgkey,
      actorkey: account.username,
    });
    
    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Membro adicionado com sucesso.',
      
      timestamp: new Date().toISOString(),
      path: '/members'
    };

    return res.status(response.status).json(response);
  }

  @Get(':projectkey')
  @Role(OrgRole.OWNER, OrgRole.MANAGER, OrgRole.MEMBER)
  @Action(BaseActions.SEEK)
  async list(
    @Param('projectkey') projectkey: string,
    @Res() res,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.repository.list(projectkey);
    
    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      
      timestamp: new Date().toISOString(),
      path: '/members'
    };

    return res.status(response.status).json(response);
  }

  @Delete('/remove/:id')
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  @Action(BaseActions.DEL)
  async delete(
    @Param('id') id: string,
    @OrgKey() orgkey: string,
    @Res() res,
    @CurrentAccount() account: CurrentAccountDTO,
  ){
    const result = await this.service.delete(id, {
      orgkey,
      actorkey: account.username,
    });
    
    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: `Membro removido com sucesso.`,
      
      timestamp: new Date().toISOString(),
      path: '/members/del'
    };

    return res.status(response.status).json(response);
  }
}
