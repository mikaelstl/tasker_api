import { IsNotEmpty, IsString } from 'class-validator';

export class RevokeOrganizationInviteDTO {
  @IsString()
  @IsNotEmpty()
  inviteId: string;
}
