import { Resources } from "@enums/Resources.enum";
import { AccessValidator } from "@interfaces/AccessValidator";
import { CommentsService } from "@modules/comments/comments.service";
import { EventsService } from "@modules/events/events.service";
import { OrganizationService } from "@modules/organization/organization.service";
import { ProjectService } from "@modules/projects/project.service";
import { TasksService } from "@modules/tasks/tasks.service";
import { Injectable } from "@nestjs/common";
import { AffiliationService } from "@modules/affiliations/affiliations.service";
import { MembersService } from "@modules/members/members.service";
import { AccessSubject } from "@interfaces/AccessContext";
import { Actions } from "@enums/Actions.enum";
import { OrgRole } from "generated/prisma";

type VerificationFunction = (sub: AccessSubject) => Promise<boolean>;

type ActionValidatorMap = Map<Actions, VerificationFunction>;

type ResourceMap = Map<Resources, ActionValidatorMap>

type RolesPermissions = Map<OrgRole, ResourceMap>

@Injectable()
export class AccessValidatorService implements Record<OrgRole, RolesPermissions> {
  readonly [OrgRole.OWNER]: RolesPermissions = new Map();
  readonly [OrgRole.MANAGER]: RolesPermissions = new Map();
  readonly [OrgRole.MEMBER]: RolesPermissions = new Map();

  constructor(
    private readonly orgs: OrganizationService,
    private readonly projects: ProjectService,
    private readonly tasks: TasksService,
    private readonly events: EventsService,
    private readonly comments: CommentsService,
    private readonly affiliations: AffiliationService,
    private readonly members: MembersService,
  ) {
    this.setOwnerPermissions();
    this.setManagerPermissions();
    this.setMemberPermissions();
  }

  private projectOwnership = async (sub: AccessSubject): Promise<boolean> => {
    const isOwner = await this.orgs.belongs(sub.userkey, sub.orgkey);

    const projectInOrg = await this.projects.belongs(sub.orgkey, sub.projectkey);

    return isOwner && projectInOrg;
  }

  private projectMembership = async (sub: AccessSubject): Promise<boolean> => {
    const participates = await this.projects.participates(sub.userkey, sub.projectkey);

    return participates;
  }

  private projectManager = async (sub: AccessSubject): Promise<boolean> => {
    const participates = await this.projects.manage(sub.userkey, sub.projectkey);

    return participates;
  }

  private orgMembership = async (sub: AccessSubject): Promise<boolean> => {
    const participates = await this.orgs.participates(sub.orgkey, sub.projectkey);

    return participates;
  }

  private orgOwnership = async (sub: AccessSubject): Promise<boolean> => {
    const isOwner = await this.orgs.belongs(sub.userkey, sub.orgkey);

    return isOwner;
  }

  private taskOwnership = async (sub: AccessSubject): Promise<boolean> => {
    const isOwner = await this.tasks.belongs(sub.userkey, sub.taskkey);

    return isOwner;
  }

  private commentOwnership = async (sub: AccessSubject): Promise<boolean> => {
    const isOwner = await this.comments.belongs(sub.userkey, sub.commentkey);

    return isOwner;
  }

  private initializePermissions() {
    const BASE: Array<Actions> = [
      Actions.CREATE,
      Actions.DEL,
      Actions.EDIT,
      Actions.SEEK
    ];
    const READ_ONLY: Array<Actions> = [Actions.SEEK];

    this.OWNER.set(
      OrgRole.OWNER,
      resourcePermissionsFactory([
        { res: Resources.ORGANIZATIONS, actions: BASE, validator: this.orgOwnership },
        { res: Resources.PROJECTS, actions: BASE, validator: this.projectOwnership }
      ])
    )
  }

  private setOwnerPermissions() {
    const ORGS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.orgOwnership(sub)],
      [Actions.DEL, (sub) => this.orgOwnership(sub)],
      [Actions.EDIT, (sub) => this.orgOwnership(sub)],
      [Actions.SEEK, (sub) => this.orgOwnership(sub)],
    ]);

    const PROJECTS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectOwnership(sub)],
      [Actions.DEL, (sub) => this.projectOwnership(sub)],
      [Actions.EDIT, (sub) => this.projectOwnership(sub)],
      [Actions.SEEK, (sub) => this.projectOwnership(sub)],
    ]);

    const MEMBERS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectOwnership(sub)],
      [Actions.DEL, (sub) => this.projectOwnership(sub)],
      [Actions.EDIT, (sub) => this.projectOwnership(sub)],
      [Actions.SEEK, (sub) => this.projectOwnership(sub)],
    ]);

    const TASKS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectOwnership(sub)],
      [Actions.DEL, (sub) => this.projectOwnership(sub)],
      [Actions.EDIT, (sub) => this.projectOwnership(sub)],
      [Actions.SEEK, (sub) => this.projectOwnership(sub)],
    ]);

    const COMMENTS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectOwnership(sub)],
      [Actions.DEL, (sub) => this.projectOwnership(sub)],
      [Actions.EDIT, async (sub) => { return false }],
      [Actions.SEEK, (sub) => this.projectOwnership(sub)],
    ]);

    const EVENTS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectOwnership(sub)],
      [Actions.DEL, (sub) => this.projectOwnership(sub)],
      [Actions.EDIT, (sub) => this.projectOwnership(sub)],
      [Actions.SEEK, (sub) => this.projectOwnership(sub)],
    ]);

    const AFFIlIATION: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.orgOwnership(sub)],
      [Actions.DEL, (sub) => this.orgOwnership(sub)],
      [Actions.EDIT, (sub) => this.orgOwnership(sub)],
      [Actions.SEEK, (sub) => this.orgOwnership(sub)],
      [Actions.DEMOTE, (sub) => this.orgOwnership(sub)],
      [Actions.PROMOTE, (sub) => this.orgOwnership(sub)],
    ]);

    const OwnerResourceAccess: ResourceMap = new Map([
      [Resources.ORGANIZATIONS, ORGS],
      [Resources.AFFILIATIONS, AFFIlIATION],
      [Resources.PROJECTS, PROJECTS],
      [Resources.MEMBERS, MEMBERS],
      [Resources.TASKS, TASKS],
      [Resources.COMMENTS, COMMENTS],
      [Resources.EVENTS, EVENTS],
    ]);

    this.OWNER.set(OrgRole.OWNER, OwnerResourceAccess);
  }

  private setManagerPermissions() {
    const ORGS: ActionValidatorMap = new Map([
      [Actions.SEEK, (sub) => this.orgMembership(sub)],
    ]);

    const PROJECTS: ActionValidatorMap = new Map([
      [Actions.SEEK, (sub) => this.projectManager(sub)],
    ]);

    const MEMBERS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectManager(sub)],
      [Actions.DEL, (sub) => this.projectManager(sub)],
      [Actions.EDIT, (sub) => this.projectManager(sub)],
      [Actions.SEEK, (sub) => this.projectManager(sub)],
    ]);

    const TASKS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectManager(sub)],
      [Actions.DEL, (sub) => this.projectManager(sub)],
      [Actions.EDIT, (sub) => this.projectManager(sub)],
      [Actions.SEEK, (sub) => this.projectManager(sub)],
    ]);

    const COMMENTS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectManager(sub)],
      [Actions.DEL, (sub) => this.projectManager(sub)],
      [Actions.EDIT, async (sub) => { return false }],
      [Actions.SEEK, (sub) => this.projectManager(sub)],
    ]);

    const EVENTS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectManager(sub)],
      [Actions.DEL, (sub) => this.projectManager(sub)],
      [Actions.EDIT, (sub) => this.projectManager(sub)],
      [Actions.SEEK, (sub) => this.projectManager(sub)],
    ]);

    const ManagerResourceAccess: ResourceMap = new Map([
      [Resources.ORGANIZATIONS, ORGS],
      [Resources.PROJECTS, PROJECTS],
      [Resources.MEMBERS, MEMBERS],
      [Resources.TASKS, TASKS],
      [Resources.COMMENTS, COMMENTS],
      [Resources.EVENTS, EVENTS],
    ]);

    this.MANAGER.set(OrgRole.MANAGER, ManagerResourceAccess);
  }

  private setMemberPermissions() {
    const ORGS: ActionValidatorMap = new Map([
      [Actions.SEEK, (sub) => this.orgMembership(sub)],
    ]);

    const PROJECTS: ActionValidatorMap = new Map([
      [Actions.SEEK, (sub) => this.projectMembership(sub)],
    ]);

    const TASKS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectOwnership(sub)],
      [Actions.DEL, (sub) => this.taskOwnership(sub)],
      [Actions.EDIT, (sub) => this.taskOwnership(sub)],
      [Actions.SEEK, (sub) => this.projectOwnership(sub)],
    ]);

    const COMMENTS: ActionValidatorMap = new Map([
      [Actions.CREATE, (sub) => this.projectMembership(sub)],
      [Actions.DEL, (sub) => this.commentOwnership(sub)],
      [Actions.EDIT, async (sub) => this.commentOwnership(sub)],
      [Actions.SEEK, (sub) => this.projectMembership(sub)],
    ]);

    const EVENTS: ActionValidatorMap = new Map([
      [Actions.SEEK, (sub) => this.projectMembership(sub)],
    ]);

    const MEMBERS: ActionValidatorMap = new Map([
      [Actions.SEEK, (sub) => this.projectMembership(sub)],
    ]);

    const MemberResourceAccess: ResourceMap = new Map([
      [Resources.ORGANIZATIONS, ORGS],
      [Resources.PROJECTS, PROJECTS],
      [Resources.TASKS, TASKS],
      [Resources.COMMENTS, COMMENTS],
      [Resources.EVENTS, EVENTS],
      [Resources.MEMBERS, MEMBERS]
    ]);

    this.MEMBER.set(OrgRole.MEMBER, MemberResourceAccess);
  }
}

type ResourcePermissionsType = { res: Resources, actions: Actions[], validator: VerificationFunction }

function resourcePermissionsFactory(defs: Array<ResourcePermissionsType>) {
  const resources: ResourceMap = new Map();
  
  defs.forEach(
    def => {
      const actions: ActionValidatorMap = new Map();

      def.actions.forEach(a => actions.set(a, def.validator));

      resources.set(def.res, actions);
    }
  );

  return resources;
}