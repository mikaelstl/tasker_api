import { AccessSubject } from "./AccessContext";
import { Resources } from "@enums/Resources.enum";

export interface ResourcePolicyHandler {
  validate(subject: AccessSubject, resource: Resources): Promise<boolean>;
}
