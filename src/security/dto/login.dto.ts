import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDTO {
  @IsNotEmpty({ message: 'Informe seu e-mail.' })
  @IsString({ message: 'O e-mail deve ser um texto.' })
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  public email: string;
  
  @IsNotEmpty({ message: 'Informe sua senha.' })
  @IsString({ message: 'A senha deve ser um texto.' })
  public password: string;
}
