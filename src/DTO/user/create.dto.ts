import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class CreateUserDTO {
  @IsNotEmpty({ message: 'ENTER YOUR NAME' })
  public name: string;

  @IsNotEmpty({ message: 'ENTER YOUR USERNAME' })
  public username: string;
  
  @IsNotEmpty()
  @MinLength(8, { message: 'INVALID PASSWORD: PASSWORD MUST HAVE AT LEAST 8 CHARACTERS' })
  @MaxLength(20, { message: 'INVALID PASSWORD: PASSWORD IS TOO LONGER' })
  @Matches(/(?=.*\d)/, {
    message: 'INVALID PASSWORD: MUST CONTAIN AT LEAST ONE NUMBER',
  })
  @Matches(/(?=.*[@$#])/, {
    message: 'INVALID PASSWORD: MUST CONTAIN AT LEAST ONE SPECIAL CHARACTER (@, $, #)',
  })
  public password: string;
  
  @IsNotEmpty({ message: 'EMAIL MUST BE HAVE A VALUE' })
  @IsEmail({}, { message: 'INVALID EMAIL FORMAT'})
  public email: string;
}