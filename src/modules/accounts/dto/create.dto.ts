import { IsEmail, IsNotEmpty, Matches, MaxLength, MinLength } from "class-validator";

export class CreateAccountDTO {
  @IsNotEmpty({ message: 'O e-mail deve ser informado.' })
  @IsEmail({}, { message: 'Formato de e-mail inválido.'})
  public email: string;

  @IsNotEmpty({ message: 'A senha deve ser informada.' })
  @MinLength(8, { message: 'Senha inválida: deve ter pelo menos 8 caracteres.' })
  @MaxLength(20, { message: 'Senha inválida: deve ter no máximo 20 caracteres.' })
  @Matches(/(?=.*\d)/, {
    message: 'Senha inválida: deve conter pelo menos um número.',
  })
  @Matches(/(?=.*[@$#])/, {
    message: 'Senha inválida: deve conter pelo menos um caractere especial (@, $, #).',
  })
  public password: string;
}
