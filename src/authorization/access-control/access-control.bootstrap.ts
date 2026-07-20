import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { Injectable, Logger, OnModuleInit, Type } from "@nestjs/common";
import { OwnerResourceAccessKeys } from "../keys/owner.keys";
import { ManagerResourceAccessKeys } from "../keys/manager.keys";
import { MemberResourceAccessKeys } from "../keys/member.keys";
import { OrganizationMembershipPolicy } from "@authorization/policies/organization-membership.policy";
import { ProjectMembershipPolicy } from "@authorization/policies/project-membership.policy";
import { TasksOwnershipPolicy } from "@authorization/policies/task-ownership.policy";
import { CommentOwnershipPolicy } from "@authorization/policies/comment-ownership.policy";
import { AccessValidatorRegistry, ResourcePoliciesKeys } from "./access-control.registry";
import { ProjectManagementPolicy } from "@authorization/policies/project-management.policy";
import { OrganizationOwnershipPolicy } from "@authorization/policies/organization-ownership.policy";
import { ProjectOwnershipPolicy } from "@authorization/policies/project-ownership.policy";
import { ModuleRef } from "@nestjs/core";

type ResourcePolicies = {
  key: ResourcePoliciesKeys;
  handler: Type<ResourcePolicyHandler>;
}

const MemberAccessHandlers: Array<ResourcePolicies> = [
  {
    key: "MEMBER:ORGS:SEEK",
    handler: OrganizationMembershipPolicy
  },
  {
    key: "MEMBER:AFFILIATIONS:SEEK",
    handler: OrganizationMembershipPolicy
  },
  {
    key: "MEMBER:PROJECTS:SEEK",
    handler: ProjectMembershipPolicy
  },
  {
    key: "MEMBER:MEMBERS:SEEK",
    handler: ProjectMembershipPolicy
  },
  {
    key: "MEMBER:EVENTS:SEEK",
    handler: ProjectMembershipPolicy
  },
  {
    key: "MEMBER:TASKS:CREATE",
    handler: ProjectMembershipPolicy
  },
  {
    key: "MEMBER:TASKS:DEL",
    handler: TasksOwnershipPolicy
  },
  {
    key: "MEMBER:TASKS:EDIT",
    handler: TasksOwnershipPolicy
  },
  {
    key: "MEMBER:TASKS:SEEK",
    handler: ProjectMembershipPolicy
  },
  {
    key: "MEMBER:COMMENTS:CREATE",
    handler: ProjectMembershipPolicy
  },
  {
    key: "MEMBER:COMMENTS:DEL",
    handler: CommentOwnershipPolicy
  },
  {
    key: "MEMBER:COMMENTS:EDIT",
    handler: CommentOwnershipPolicy
  },
  {
    key: "MEMBER:COMMENTS:SEEK",
    handler: ProjectMembershipPolicy
  },
]

const ManagerAccessHandlers: Array<ResourcePolicies> = [
  {
    key: "MANAGER:ORGS:SEEK",
    handler: OrganizationMembershipPolicy
  },
  {
    key: "MANAGER:AFFILIATIONS:SEEK",
    handler: OrganizationMembershipPolicy
  },
  {
    key: "MANAGER:PROJECTS:SEEK",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:PROJECT_STATS:SEEK",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:PROJECT_STATS:CREATE",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:MEMBERS:CREATE",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:MEMBERS:DEL",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:MEMBERS:EDIT",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:MEMBERS:SEEK",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:TASKS:CREATE",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:TASKS:DEL",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:TASKS:EDIT",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:TASKS:SEEK",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:COMMENTS:CREATE",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:COMMENTS:DEL",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:COMMENTS:EDIT",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:COMMENTS:SEEK",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:EVENTS:CREATE",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:EVENTS:DEL",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:EVENTS:EDIT",
    handler: ProjectManagementPolicy
  },
  {
    key: "MANAGER:EVENTS:SEEK",
    handler: ProjectManagementPolicy
  },
]

const OwnerAccessHandlers: Array<ResourcePolicies> = [
  {
    key: "OWNER:ORGS:CREATE",
    handler: OrganizationOwnershipPolicy
  },
  {
    key: "OWNER:ORGS:DEL",
    handler: OrganizationOwnershipPolicy
  },
  {
    key: "OWNER:ORGS:EDIT",
    handler: OrganizationOwnershipPolicy
  },
  {
    key: "OWNER:ORGS:SEEK",
    handler: OrganizationOwnershipPolicy
  },
  {
    key: "OWNER:AFFILIATIONS:CREATE",
    handler: OrganizationOwnershipPolicy
  },
  {
    key: "OWNER:AFFILIATIONS:DEL",
    handler: OrganizationOwnershipPolicy
  },
  {
    key: "OWNER:AFFILIATIONS:EDIT",
    handler: OrganizationOwnershipPolicy
  },
  {
    key: "OWNER:AFFILIATIONS:SEEK",
    handler: OrganizationOwnershipPolicy
  },
  {
    key: "OWNER:PROJECTS:CREATE",
    handler: OrganizationOwnershipPolicy
  },
  {
    key: "OWNER:PROJECTS:DEL",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:PROJECTS:EDIT",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:PROJECTS:SEEK",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:PROJECT_STATS:SEEK",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:PROJECT_STATS:CREATE",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:MEMBERS:CREATE",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:MEMBERS:DEL",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:MEMBERS:EDIT",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:MEMBERS:SEEK",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:TASKS:CREATE",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:TASKS:DEL",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:TASKS:EDIT",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:TASKS:SEEK",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:COMMENTS:CREATE",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:COMMENTS:DEL",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:COMMENTS:EDIT",
    handler: ProjectOwnershipPolicy
  },
  {
    key: "OWNER:EVENTS:SEEK",
    handler: ProjectOwnershipPolicy
  },
]


@Injectable()
export class AccessControlBootstrap implements OnModuleInit {
  private readonly logger: Logger = new Logger('AccessControlBootstrap');

  private readonly registry: AccessValidatorRegistry = AccessValidatorRegistry.instance();

  constructor(
    private readonly moduleRef: ModuleRef
  ) { }

  async onModuleInit() {
    const handlers = [...MemberAccessHandlers, ...ManagerAccessHandlers, ...OwnerAccessHandlers];

    handlers.map(
      async ({ key, handler }) => {
        const policy = this.moduleRef.get(handler, { strict: false });

        this.registry.register(key, policy);
      }
    );

    this.logger.log("ALL HANDLERS REGISTERED");
  }
}
