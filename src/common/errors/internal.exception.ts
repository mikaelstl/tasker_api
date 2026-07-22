/**
 * Falha tecnica inesperada. Nao possui status ou mensagem HTTP publica.
 * O `cause` e preservado exclusivamente para diagnostico no log interno.
 */
export class InternalException extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = InternalException.name;
  }
}
