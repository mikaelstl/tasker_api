import { AccessSubject } from "@interfaces/AccessContext";
import { ProjectService } from "@modules/projects/project.service";
import { Injectable } from "@nestjs/common";

class ProjectAccessHandler {
  constructor(
    private readonly service: ProjectService
  ) {}

  
}