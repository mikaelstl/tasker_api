import { ApiResponse } from "@interfaces/response";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ProjectInvitesRepository, SendInvitesDTO } from "@repositories/project_invites.repository";
import { ProjectRepository } from "@repositories/projects.repository";
import { ProjectService } from "./project.service";

@Injectable()
export class ProjectInvitesService {
  constructor(
    private readonly inviteRepository: ProjectInvitesRepository,
    private readonly projectService: ProjectService
  ){}

  async send(data: SendInvitesDTO) {
    const request = await this.inviteRepository.create(data);

    return request;
  }

  async list(username: string) {
    const invites = await this.inviteRepository.list(username);
    
    return invites;
  }

  async accept(id: string) {
    const result = await this.inviteRepository.edit(id, { pending: false });

    if (!result) {
      throw new NotFoundException("Invite not found");
    }

    const { receiverkey, projectkey } = result;

    this.projectService.addMember({
      project: projectkey,
      user: receiverkey
    });

    return 'Success adding member to project.';
  }

  async del(id: string) {
    const response = await this.inviteRepository.delete(id);
    return response;
  }
}