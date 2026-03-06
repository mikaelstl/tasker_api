import { IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class LoginDTO {
  @IsNotEmpty({ message: 'Enter your e-mail' })
  public email: string;
  
  @IsNotEmpty({ message: 'Enter your password' })
  public password: string;
}