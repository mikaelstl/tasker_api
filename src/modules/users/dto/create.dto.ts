import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDTO {
  @IsNotEmpty({ message: 'Please enter your name' })
  public name: string;

  @IsNotEmpty({ message: 'Please enter your username' })
  public username: string;
  
  // @IsNotEmpty({ message: 'Your must have create a user with link to a Organization, please ask for a Organization a create account link.' })
  public orgkey?: string;

  @IsNotEmpty()
  readonly accountkey: string;
}