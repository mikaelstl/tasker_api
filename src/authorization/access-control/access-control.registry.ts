import { ResourcePolicyHandler } from "@interfaces/ResourcePolicyHandler";
import { Injectable } from "@nestjs/common";
import { OwnerResourceAccessKeys } from "../keys/owner.keys";
import { ManagerResourceAccessKeys } from "../keys/manager.keys";
import { MemberResourceAccessKeys } from "../keys/member.keys";

export type ResourcePoliciesKeys = OwnerResourceAccessKeys | ManagerResourceAccessKeys | MemberResourceAccessKeys;

@Injectable()
export class AccessValidatorRegistry {
  private static _instance: AccessValidatorRegistry;

  private readonly policies = new Map<ResourcePoliciesKeys, ResourcePolicyHandler>();

  public register(key: ResourcePoliciesKeys, policy: ResourcePolicyHandler) {
    this.policies.set(key, policy);
  }

  public get(key: ResourcePoliciesKeys): ResourcePolicyHandler {
    return this.policies.get(key);
  }

  public has(key: ResourcePoliciesKeys): boolean {
    return this.policies.has(key);
  }

  public static instance() {
    if (!this._instance) this._instance = new AccessValidatorRegistry();

    return this._instance;
  }
}