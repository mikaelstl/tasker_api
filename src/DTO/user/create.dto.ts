import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDTO {
  @IsNotEmpty({ message: 'ENTER YOUR NAME' })
  public name: string;

  @IsNotEmpty({ message: 'ENTER YOUR USERNAME' })
  public username: string;

  @IsNotEmpty()
  public orgkey: string;

  @IsNotEmpty()
  readonly accountkey: string;
}