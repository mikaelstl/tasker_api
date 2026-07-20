import { ApiResponse } from "src/common/interfaces/ApiResponse";
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Query, Res, UseGuards } from "@nestjs/common";
import { MembersRepository } from "../members/member.repository";
import { JwtAuthGuard } from "../../security/auth.guard";
import { ProjectService } from "@modules/projects/project.service";
import { CreateProjectDTO } from "@modules/projects/dto/project.create.dto";
import { ProjectQueryDTO } from "@modules/projects/dto/project.query.dto";
import { ProjectRepository } from "@modules/projects/projects.repository";
import { PermissionGuard } from "@guards/permission.guard";
import { OrgRole, StatsPeriodType } from "generated/prisma";
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
    private readonly repository: ProjectRepository,
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
    @Res() response
  ) {
    const result = await this.service.create({
      ...data,
      ownerkey: orgkey
    });

    const resp: ApiResponse = {
      status: HttpStatus.CREATED,
      data: result,
      message: 'Novo projeto criado com sucesso.',

      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return response.status(resp.status).json(resp);
  }

  @Get('/list')
  @Action(BaseActions.SEEK)
  @UseGuards(PermissionGuard)
  async list(
    @Query() queries: ProjectQueryDTO,
    @OrgKey() orgkey: string,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.repository.list({ ownerkey: orgkey });

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',

      timestamp: new Date().toISOString(),
      path: '/project/list'
    };

    return response.status(resp.status).json(resp);
  }

  @Get('/:id')
  @Action(BaseActions.SEEK)
  @UseGuards(PermissionGuard)
  async find(
    @Param('id') id: string,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.repository.find(id);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: '',
      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return response.status(resp.status).json(resp);
  }

  @Put('/:id')
  @Role(OrgRole.OWNER)
  @Action(BaseActions.EDIT)
  @UseGuards(PermissionGuard)
  async edit(
    @Param('id') id: string,
    @Body() data: EditProjectDTO,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.repository.edit(id, data);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: 'Projeto atualizado com sucesso.',
      timestamp: new Date().toISOString(),
      path: '/project'
    };

    return response.status(resp.status).json(resp);
  }

  @Delete('/del/:id')
  @Role(OrgRole.OWNER)
  @Action(BaseActions.DEL)
  @UseGuards(PermissionGuard)
  async delete(
    @Param('id') id: string,
    @Res() response,
    @CurrentAccount() account: CurrentAccountDTO,
  ) {
    const result = await this.repository.delete(id);

    const resp: ApiResponse = {
      status: HttpStatus.OK,
      data: result,
      message: `Projeto excluído com sucesso.`,

      timestamp: new Date().toISOString(),
      path: '/project/del'
    };

    return response.status(resp.status).json(resp);
  }

  @Get('/:id/stats')
  @Resource(Resources.PROJECT_STATS)
  @Action(BaseActions.SEEK)
  @UseGuards(PermissionGuard)
  async getProjectStats(
    @Param("id") id: string,
    @Query() query: ProjectStatsQueryDTO,
    @Res() response
  ) {
    const cutoffAt = query.cutoffAt
      ? new Date(query.cutoffAt)
      : new Date();
    const result = await this.stats.getProjectStats(
      id,
      cutoffAt
    );

    return this.respond(
      response,
      HttpStatus.OK,
      result,
      `/project/${id}/stats`
    );
  }

  @Post("/:id/stats/report")
  @Resource(Resources.PROJECT_STATS)
  @Action(BaseActions.CREATE)
  @UseGuards(PermissionGuard)
  async generateReport(
    @Param("id") id: string,
    @Body() data: GenerateStatsReportDTO,
    @Res() response
  ) {
    const result = await this.stats.generateReport({
      projectkey: id,
      periodType: data.periodType ?? StatsPeriodType.WEEK,
      cutoffAt: data.cutoffAt
        ? new Date(data.cutoffAt)
        : new Date()
    });

    response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Content-Length": result.document.length,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    });

    return response.status(HttpStatus.OK).send(result.document);
  }

  @Get("/:id/stats/reports")
  @Resource(Resources.PROJECT_STATS)
  @Action(BaseActions.SEEK)
  @UseGuards(PermissionGuard)
  async listReports(
    @Param("id") id: string,
    @Res() response
  ) {
    const result = await this.stats.listReports(id);

    return this.respond(
      response,
      HttpStatus.OK,
      result,
      `/project/${id}/stats/reports`
    );
  }

  @Get("/:id/stats/reports/:reportkey")
  @Resource(Resources.PROJECT_STATS)
  @Action(BaseActions.SEEK)
  @UseGuards(PermissionGuard)
  async getReport(
    @Param("id") id: string,
    @Param("reportkey") reportkey: string,
    @Res() response
  ) {
    const result = await this.stats.getReport(
      reportkey,
      id
    );

    return this.respond(
      response,
      HttpStatus.OK,
      result,
      `/project/${id}/stats/reports/${reportkey}`
    );
  }

  private respond(
    response: any,
    status: HttpStatus,
    data: unknown,
    path: string,
    message = ""
  ) {
    const payload: ApiResponse = {
      status,
      data,
      message,
      timestamp: new Date().toISOString(),
      path
    };

    return response.status(status).json(payload);
  }
}
