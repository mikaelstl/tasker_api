import { ApiResponse as ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { MembersRepository } from "../members/member.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { ProjectService } from "@modules/projects/project.service";
import { CreateProjectDTO } from "@modules/projects/dto/project.create.dto";
import { ProjectQueryDTO } from "@modules/projects/dto/project.query.dto";
import { PermissionGuard } from "@guards/permission.guard";
import { OrgRole } from "generated/prisma";
import { CurrentAccount } from "src/decorators/CurrentAccount.decorator";
import { CurrentAccountDTO } from "@modules/users/dto/current-account.dto";
import { EditProjectDTO } from "@modules/projects/dto/edit.dto";
import { Resources } from "src/common/enums/Resources.enum";
import { Resource } from "@decorators/Resource";
import { Role } from "@decorators/Role";
import { OrgKey } from "@decorators/OrgKey";
import { Action } from "@decorators/Action";
import { BaseActions } from "src/common/enums/Actions.enum";
import { ProjectStatsQueryDTO } from "@modules/stats/dto/project-stats-query.dto";
import { GenerateStatsReportDTO } from "@modules/stats/dto/generate-stats-report.dto";
import { StatsService } from "@modules/stats/stats.service";

@Controller('project')
@UseGuards(JwtAuthGuard)
@Resource(Resources.PROJECTS)
export class ProjectController {
  constructor(
    private readonly service: ProjectService,
    private readonly stats: StatsService
  ) { }

  @Post()
  @Action(BaseActions.CREATE)
  @Role(OrgRole.OWNER)
  @UseGuards(PermissionGuard)
  async create(
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
    @Body() data: CreateProjectDTO,
    @Res() res
  ) {
    const result = await this.service.create({
      ...data,
      orgkey
    }, account.username);

    const response: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Novo projeto criado com sucesso.',

      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return res.status(response.status).json(response);
  }

  @Get('/list')
  @Action(BaseActions.SEEK)
  @Role(OrgRole.OWNER, OrgRole.MEMBER, OrgRole.MANAGER)
  @UseGuards(PermissionGuard)
  async list(
    @Query() queries: ProjectQueryDTO,
    @OrgKey() orgkey: string,
    @Res() res,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.service.list(account, orgkey, queries);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',

      timestamp: new Date().toISOString(),
      path: '/project/list'
    };

    return res.status(response.status).json(response);
  }

  @Get('/:id')
  @Action(BaseActions.SEEK)
  @Role(OrgRole.OWNER, OrgRole.MEMBER, OrgRole.MANAGER)
  @UseGuards(PermissionGuard)
  async find(
    @Param('id') id: string,
    @OrgKey() orgkey: string,
    @Res() res,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.service.find(id, account, orgkey);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return res.status(response.status).json(response);
  }

  @Put('/:id')
  @Role(OrgRole.OWNER)
  @Action(BaseActions.EDIT)
  @UseGuards(PermissionGuard)
  async edit(
    @Param('id') id: string,
    @Body() data: EditProjectDTO,
    @OrgKey() orgkey: string,
    @Res() res,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.service.edit(id, data, {
      orgkey,
      actorkey: account.username,
    });

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Projeto atualizado com sucesso.',
      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return res.status(response.status).json(response);
  }

  @Delete('/del/:id')
  @Role(OrgRole.OWNER)
  @Action(BaseActions.DEL)
  @UseGuards(PermissionGuard)
  async delete(
    @Param('id') id: string,
    @OrgKey() orgkey: string,
    @Res() res,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.service.delete(id, {
      orgkey,
      actorkey: account.username,
    });

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: `Projeto excluído com sucesso.`,

      timestamp: new Date().toISOString(),
      path: '/project/del'
    };

    return res.status(response.status).json(response);
  }

  @Get('/:id/stats')
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  @Resource(Resources.PROJECT_STATS)
  @Action(BaseActions.SEEK)
  @UseGuards(PermissionGuard)
  async getProjectStats(
    @Param("id") id: string,
    @Query() query: ProjectStatsQueryDTO,
    @Res() res
  ) {
    const result = await this.stats.getProjectStats(id, query.month);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      timestamp: new Date().toISOString(),
      path: `/project/${id}/stats`
    };

    return res.status(response.status).json(response);
  }

  @Get('/:id/stats/members')
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  @Resource(Resources.PROJECT_STATS)
  @Action(BaseActions.SEEK)
  @UseGuards(PermissionGuard)
  async getProjectMemberStats(
    @Param('id') id: string,
    @Query() query: ProjectStatsQueryDTO,
    @Res() res
  ) {
    const result = await this.stats.getProjectMemberStats(id, query.month);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      timestamp: new Date().toISOString(),
      path: `/project/${id}/stats/members`
    };

    return res.status(response.status).json(response);
  }

  @Get('/:id/stats/members/performance')
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  @Resource(Resources.PROJECT_STATS)
  @Action(BaseActions.SEEK)
  @UseGuards(PermissionGuard)
  async getProjectMemberPerformance(
    @Param('id') id: string,
    @Query() query: ProjectStatsQueryDTO,
    @Res() res
  ) {
    const result = await this.stats.getProjectMemberPerformance(id, query.month);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      timestamp: new Date().toISOString(),
      path: `/project/${id}/stats/members/performance`
    };

    return res.status(response.status).json(response);
  }

  @Post("/:id/stats/report")
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  @Resource(Resources.PROJECT_STATS)
  @Action(BaseActions.CREATE)
  @UseGuards(PermissionGuard)
  async generateReport(
    @Param("id") id: string,
    @Body() data: GenerateStatsReportDTO,
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
    @Res() res
  ) {
    const result = await this.stats.generateReport({
      projectkey: id,
      month: data.month
    }, {
      orgkey,
      actorkey: account.username,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Content-Length": result.document.length,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    });

    return res.status(HttpStatus.OK).send(result.document);
  }

  @Get("/:id/stats/reports")
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  @Resource(Resources.PROJECT_STATS)
  @Action(BaseActions.SEEK)
  @UseGuards(PermissionGuard)
  async listReports(
    @Param("id") id: string,
    @Res() res
  ) {
    const result = await this.stats.listReports(id);

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      timestamp: new Date().toISOString(),
      path: `/project/${id}/stats/reports`
    };

    return res.status(response.status).json(response);
  }

  @Get("/:id/stats/reports/:reportkey")
  @Role(OrgRole.OWNER, OrgRole.MANAGER)
  @Resource(Resources.PROJECT_STATS)
  @Action(BaseActions.SEEK)
  @UseGuards(PermissionGuard)
  async getReport(
    @Param("id") id: string,
    @Param("reportkey") reportkey: string,
    @Res() res
  ) {
    const result = await this.stats.getReport(
      reportkey,
      id
    );

    const response: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      timestamp: new Date().toISOString(),
      path: `/project/${id}/stats/reports/${reportkey}`
    };

    return res.status(response.status).json(response);
  }
}
