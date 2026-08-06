export interface AccountDTO {
  readonly id?: string;
  readonly email: string;
}

/** Credenciais para uso interno durante a autenticação. Nunca expor em respostas HTTP. */
export interface AccountCredentialsDTO extends AccountDTO {
  readonly password: string;
}
