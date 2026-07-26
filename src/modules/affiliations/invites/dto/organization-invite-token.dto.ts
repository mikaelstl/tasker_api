import { IsNotEmpty, IsString } from 'class-validator';

export class OrganizationInviteTokenDTO {
  @IsString()
  @IsNotEmpty()
  token: string;
}
