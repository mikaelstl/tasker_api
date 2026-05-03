export interface ResourcePolicyHandler {
  validate(subject: string, target: string): Promise<boolean>;
}