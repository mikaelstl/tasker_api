import { IsNotEmpty } from "class-validator";

export class LoginDTO {
  @IsNotEmpty({ message: 'Informe seu e-mail.' })
  public email: string;
  
  @IsNotEmpty({ message: 'Informe sua senha.' })
  public password: string;
}
