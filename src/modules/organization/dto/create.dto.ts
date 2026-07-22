import { IsNotEmpty, IsString } from 'class-validator';

export class OrganizationCreateDTO {
  @IsNotEmpty({ message: 'Informe um nome para a organização.' })
  @IsString({ message: 'O nome da organização deve ser um texto.' })
  name:               string;
  ownerkey?:           string;
}
