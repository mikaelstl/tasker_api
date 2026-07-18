import { IsEmpty, IsNotEmpty } from "class-validator";

export class OrganizationCreateDTO {
  @IsNotEmpty({ message: 'Informe um nome para a organização.' })
  name:               string;
  ownerkey?:           string;
}
