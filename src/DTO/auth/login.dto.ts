import { IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class LoginDTO {
  @IsNotEmpty({ message: 'Enter your username' })
  public username: string;
  
  @IsNotEmpty({ message: 'Enter your password' })
  public password: string;
}