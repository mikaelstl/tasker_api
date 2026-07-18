import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDTO {
  @IsNotEmpty({ message: 'Informe seu nome.' })
  public name: string;

  @IsNotEmpty({ message: 'Informe seu nome de usuário.' })
  public username: string;
  
  // @IsNotEmpty({ message: 'O usuário deve estar vinculado a uma organização.' })
  public orgkey?: string;

  @IsNotEmpty({ message: 'A conta vinculada deve ser informada.' })
  readonly accountkey: string;
}
