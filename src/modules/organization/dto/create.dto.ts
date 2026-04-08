import { IsEmpty, IsNotEmpty } from "class-validator";

export class OrganizationCreateDTO {
  @IsNotEmpty({ message: 'Please enter a name to your Organization' })
  name:               string;
  ownerkey?:           string;
}