import { AccessSubject } from "./AccessContext";

export interface ResourcePolicyHandler {
  validate(subject: AccessSubject): Promise<boolean>;
}