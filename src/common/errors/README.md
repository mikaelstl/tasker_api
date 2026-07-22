# Tratamento de erros da API

Toda falha HTTP deve terminar no contrato `ApiError`, definido em `src/common/interfaces/Error.ts`. A aplicacao possui exatamente tres categorias.

## Validacao

Use `ValidationException` quando os dados recebidos nao puderem ser aceitos: campo ausente, campo desconhecido, formato ou tipo incorreto. O `ValidationPipe` global ja converte os erros dos DTOs para essa excecao. Validacoes manuais de entrada tambem devem lanca-la.

- HTTP: `400`
- `level`: `validation`
- `error`: `VALIDATION_ERROR`
- filter: `ValidationExceptionFilter`

## Negocio

Erros de negocio sao resultados esperados da regra da aplicacao: recurso inexistente, credenciais invalidas, falta de permissao, conflito ou usuario fora da organizacao. A mensagem e o status sao publicos e devem ser seguros para o cliente.

`BusinessException` e uma classe abstrata e nao deve ser lancada diretamente. Escolha uma variacao de status ou uma excecao especifica do recurso:

| Situacao | Excecao | HTTP | Mensagem padrao |
| --- | --- | --- | --- |
| Credencial ausente, invalida ou expirada | `UnauthorizedException` | `401` | `Voce nao tem autorizacao para realizar esta acao. Entre na sua conta ou crie uma nova.` |
| Usuario autenticado sem permissao | `AccessDeniedException` | `403` | `Voce nao tem permissao para realizar esta acao.` |
| Recurso inexistente | `UserNotFoundException`, `ProjectNotFoundException`, `TaskNotFoundException` etc. | `404` | Mensagem propria do recurso |
| Estado conflitante | `ConflictException` ou uma filha de escopo | `409` | Mensagem propria da regra |
| Outra regra conhecida | `BusinessRuleException` ou uma filha de escopo | `400` | Mensagem propria da regra |
| Dados validos, mas semanticamente improcessaveis | `UnprocessableEntityBusinessException` ou uma filha de escopo | `422` | Mensagem propria da regra |

Ao adicionar um novo recurso, crie uma filha de `ResourceNotFoundException` em vez de repetir status e mensagem nos servicos. Quando uma regra se repetir ou representar um conceito do dominio, crie uma filha de `ConflictException` ou `BusinessRuleException`.

- HTTP: o status da regra (`400`, `401`, `403`, `404`, `409` ou `422`)
- `level`: `warning`
- `error`: `BUSINESS_ERROR`
- filter: `BusinessExceptionFilter`

## Interno

Falhas do Prisma/banco, conexao, servicos externos, TypeScript/JavaScript e bugs nao devem ser convertidas para excecoes HTTP. Deixe a excecao original subir ou use `InternalException` com a falha original no `cause`. Se for necessario fazer rollback ou limpeza em um `catch`, relance a mesma excecao ou uma `InternalException` que preserve a causa.

- HTTP: `500`
- mensagem publica: `Erro interno inesperado`
- `level`: `critical`
- `error`: `INTERNAL_ERROR`
- filter: `InternalExceptionFilter`
- log: metodo, rota, tipo, mensagem e stack trace originais no terminal

Nunca inclua mensagem, stack trace, SQL, credenciais ou detalhes de conexao na resposta de um erro interno.
