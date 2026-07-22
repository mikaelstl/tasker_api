import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDTO {
  @IsNotEmpty({ message: 'Informe seu nome.' })
  @IsString({ message: 'O nome deve ser um texto.' })
  public name: string;

  @IsNotEmpty({ message: 'Informe seu nome de usuário.' })
  @IsString({ message: 'O nome de usuário deve ser um texto.' })
  public username: string;
  
  // @IsNotEmpty({ message: 'O usuário deve estar vinculado a uma organização.' })
  public orgkey?: string;

  @IsNotEmpty({ message: 'A conta vinculada deve ser informada.' })
  @IsString({ message: 'A conta vinculada deve ser um texto.' })
  readonly accountkey: string;
}
