import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class EditAccountDTO {
  @IsOptional()
  @IsNotEmpty({ message: 'Informe seu nome.' })
  @IsString({ message: 'O nome deve ser um texto.' })
  public name?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'Informe seu nome de usuário.' })
  @IsString({ message: 'O nome de usuário deve ser um texto.' })
  public username?: string;

  @IsOptional()
  @IsString({ message: 'O e-mail deve ser um texto.' })
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  public email?: string;

  @IsOptional()
  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(8, { message: 'Senha inválida: deve ter pelo menos 8 caracteres.' })
  @MaxLength(20, { message: 'Senha inválida: deve ter no máximo 20 caracteres.' })
  @Matches(/(?=.*\d)/, {
    message: 'Senha inválida: deve conter pelo menos um número.',
  })
  @Matches(/(?=.*[@$#])/, {
    message: 'Senha inválida: deve conter pelo menos um caractere especial (@, $, #).',
  })
  public password?: string;
}
