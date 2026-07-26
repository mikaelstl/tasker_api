# Contexto de implementação — convite de organização por token

## Objetivo

Permitir que somente o `OWNER` de uma organização gere um código/token de
convite e que um usuário autenticado possa aceitar ou rejeitar esse convite.

O backend é responsável por:

- gerar, assinar, validar, consumir, rejeitar e revogar o token;
- persistir o estado atual do convite;
- criar a `Affiliation` como `MEMBER` no aceite;
- devolver os dados públicos necessários para a tela de confirmação.

O backend **não monta nem devolve o link completo**. O frontend recebe somente
o token e monta o endereço usando a URL da própria aplicação. Exemplo:

```text
token retornado pela API: xxxxxxx
rota do frontend:          /org/join/<token>
link montado pelo front:   https://tasker.com/org/join/xxxxxxx
```

Este documento descreve a implementação recomendada; a funcionalidade ainda
não está implementada no código.

## Regras do primeiro incremento

Cada convite deve:

- ser criado somente pelo `OWNER` da organização ativa;
- conceder somente a role `MEMBER`;
- expirar, por exemplo, em 24 horas;
- aceitar somente um usuário;
- poder ser aceito ou rejeitado pelo convidado;
- poder ser revogado pelo owner antes do uso;
- exigir autenticação para aceite e rejeição;
- deixar de ser válido após aceite, rejeição, revogação ou expiração.

O convite é uma credencial portável. Qualquer usuário autenticado que obtenha
o token pode aceitá-lo ou rejeitá-lo. Um convite destinado a uma pessoa
específica exigiria uma regra adicional, como `invitedEmail`, que fica fora
deste incremento.

## Responsabilidade do token e validade atual

O conteúdo funcional assinado do token deve conter somente:

```ts
type OrganizationInviteTokenPayload = {
  orgkey: string; // id da organização
  exp: number;    // instante de expiração
};
```

Não incluir nome da organização, role, usuário convidado, URL do frontend ou
qualquer permissão configurável. A role continua fixa como `MEMBER` no backend.

O token pode ser decodificado pelo frontend para obter `orgkey` e `exp`, mas
esses valores servem apenas para apresentação inicial. O frontend nunca deve
considerar um token válido somente porque conseguiu decodificá-lo.

### Por que `valid` não deve ser gravado no payload

A validade é mutável. Um token emitido com `valid: true` continuaria contendo
esse valor mesmo depois de aceito, rejeitado ou revogado. Portanto, “se o token
ainda é válido” deve ser um estado calculado pelo backend:

```text
valid = assinatura válida
     AND expiração futura
     AND convite persistido
     AND usedAt IS NULL
     AND rejectedAt IS NULL
     AND revokedAt IS NULL
```

Assim, o código é formado somente pelo identificador da organização e pela
expiração, protegidos por assinatura, enquanto a API é a fonte de verdade da
validade atual. O endpoint de consulta devolve esse resultado como `valid`.

O nome e demais dados públicos da organização não devem ser embutidos no token,
pois a regra limita seu conteúdo ao ID e à expiração e dados organizacionais
podem mudar. A tela consulta esses dados no backend usando o token.

## Estado atual reaproveitado

O projeto já possui:

- `Organization.ownerkey -> User.username` como fonte de verdade do dono;
- uma afiliação `OWNER` criada junto com a organização;
- JWT e `@CurrentAccount()` para identificar o usuário;
- `x-org-key`, `PermissionGuard` e `OrganizationOwnershipPolicy`;
- as permissões administrativas de `AFFILIATIONS`;
- `Affiliation.role` com default `MEMBER`;
- `@@unique([userkey, orgkey])` em `Affiliation`;
- PostgreSQL e Prisma para consumo transacional.

O endpoint administrativo `POST /affiliations` não deve ser usado pelo
convidado. No aceite, os valores são definidos pelo servidor:

- `userkey`: `request.user.username`;
- `orgkey`: payload validado e registro persistido do convite;
- `role`: sempre `MEMBER`.

## Fluxo completo

```text
OWNER autenticado
  -> POST /org/invites + x-org-key
  -> API autoriza o owner, gera e assina o token
  -> banco armazena o hash do token e seu estado
  -> resposta devolve token e expiresAt, nunca uma URL

Frontend do owner
  -> monta https://tasker.com/org/join/<token>
  -> apresenta o link para compartilhamento

Convidado abre /org/join/<token>
  -> frontend extrai o token do path
  -> POST /org/invites/preview { token }
  -> API valida o token e devolve organização pública, expiração e valid
  -> frontend exibe a organização e os botões Aceitar e Rejeitar

Aceitar
  -> POST /org/invites/accept { token } + JWT
  -> API cria Affiliation(MEMBER) e consome o convite na mesma transação

Rejeitar
  -> POST /org/invites/reject { token } + JWT
  -> API registra a rejeição e invalida o convite
```

Nenhum `GET` deve aceitar ou rejeitar o convite. Previews de mensagens,
navegadores e scanners podem abrir links automaticamente.

## Alteração mínima no schema Prisma

Adicionar a relação em `Organization`:

```prisma
model Organization {
  // campos atuais
  invites OrganizationInvite[]
}
```

Adicionar o model:

```prisma
model OrganizationInvite {
  id        String @id @default(cuid())
  tokenHash String @unique @map("token_hash") @db.Char(64)

  orgkey String
  org    Organization @relation(fields: [orgkey], references: [id], onDelete: Cascade)

  expiresAt DateTime  @map("expires_at")
  usedAt    DateTime? @map("used_at")
  rejectedAt DateTime? @map("rejected_at")
  rejectedBy String?   @map("rejected_by")
  revokedAt DateTime?  @map("revoked_at")

  created_at DateTime @default(now())

  @@index([orgkey, created_at])
  @@index([expiresAt])
  @@map("organization_invites")
}
```

`usedAt`, `rejectedAt` e `revokedAt` representam estados terminais. O campo
`rejectedBy` registra o username autenticado que rejeitou o convite. O status e
o booleano `valid` são derivados; não é necessário criar um enum de status.

Depois da edição:

```bash
npm run migrate:new -- add_organization_invites
npm run prisma:generate
```

Em produção, aplicar a migration versionada com `npm run migrate:deploy`.

## Geração e armazenamento do token

Usar uma assinatura específica para convites, separada do JWT de sessão. O
payload funcional deve possuir somente `orgkey` e `exp`. Cabeçalho, assinatura
e metadados técnicos do formato não fazem parte dos dados de negócio.

O token bruto é retornado somente na criação. O banco armazena seu SHA-256:

```ts
import { createHash } from 'node:crypto';

const tokenHash = createHash('sha256').update(token).digest('hex');
```

A validação deve conferir tanto a assinatura/expiração quanto o registro
persistido identificado por `tokenHash`. Não registrar token, hash ou URL
completa em logs.

O backend não precisa conhecer a URL da aplicação. Não adicionar
`WEB_APP_URL`, não ler `Host`/`Origin` para montar links e não retornar um campo
`url`.

## Padrão de rotas

Novas rotas devem seguir `/<recurso>/<subrecurso>/<acao>`. Para este fluxo, o
recurso é `org` e o subrecurso é `invites`:

| Operação | Método e rota | Autorização |
| --- | --- | --- |
| Criar token | `POST /org/invites` | JWT + owner da `x-org-key` |
| Consultar convite | `POST /org/invites/preview` | pública, com rate limit |
| Aceitar convite | `POST /org/invites/accept` | JWT |
| Rejeitar convite | `POST /org/invites/reject` | JWT |
| Revogar como owner | `POST /org/invites/revoke` | JWT + owner da `x-org-key` |

A criação não precisa de uma ação no path porque `POST /org/invites` já
expressa a criação do recurso. Evitar nomes fundidos como
`/organization-invites` e rotas verbais fora dessa hierarquia.

### Criar convite

```http
POST /org/invites
Authorization: Bearer <jwt-do-owner>
x-org-key: <organization-id>
```

O body fica vazio. Não aceitar `orgkey`, role, duração, URL ou `createdBy` do
cliente.

Resposta sugerida:

```json
{
  "status": 201,
  "message": "Convite criado com sucesso.",
  "data": {
    "id": "invite-id",
    "token": "xxxxxxx",
    "expiresAt": "2026-07-23T18:00:00.000Z"
  },
  "path": "/org/invites",
  "timestamp": "2026-07-22T18:00:00.000Z"
}
```

O frontend usa o `token` para montar `/org/join/<token>` com a própria origem.

O controller pode reutilizar a autorização existente:

```ts
@Controller('org/invites')
@UseGuards(JwtAuthGuard)
export class OrganizationInviteController {
  @Post()
  @Resource(Resources.AFFILIATIONS)
  @Role(OrgRole.OWNER)
  @Action(BaseActions.CREATE)
  @UseGuards(PermissionGuard)
  create(
    @CurrentAccount() account: CurrentAccountDTO,
    @OrgKey() orgkey: string,
  ) {
    return this.service.create(orgkey, account.username);
  }
}
```

### Consultar convite e organização

```http
POST /org/invites/preview
Content-Type: application/json

{
  "token": "xxxxxxx"
}
```

Resposta para convite disponível:

```json
{
  "status": 200,
  "data": {
    "valid": true,
    "expiresAt": "2026-07-23T18:00:00.000Z",
    "organization": {
      "id": "organization-id",
      "name": "Nome da organização"
    }
  }
}
```

Esse endpoint não altera estado e devolve somente campos públicos. Ele pode
ser público para que a página mostre a organização antes do login, mas deve
ter rate limit e resposta uniforme para tokens indisponíveis. Não usar o token
como parâmetro de URL da API, reduzindo exposição em access logs.

### Aceitar convite

```http
POST /org/invites/accept
Authorization: Bearer <jwt-do-convidado>
Content-Type: application/json

{
  "token": "xxxxxxx"
}
```

Usa somente `JwtAuthGuard`. Não usa `PermissionGuard` nem exige `x-org-key`,
pois o convidado ainda não possui afiliação. O `username` vem do JWT.

Resposta sugerida: `201 Created` com a nova `Affiliation`, sem devolver o
token. Usuário já afiliado recebe `409 Conflict`. Token inexistente, expirado,
usado, rejeitado ou revogado recebe a mesma resposta, por exemplo
`410 Gone: Convite inválido ou indisponível`.

### Rejeitar convite

```http
POST /org/invites/reject
Authorization: Bearer <jwt-do-convidado>
Content-Type: application/json

{
  "token": "xxxxxxx"
}
```

Também usa somente `JwtAuthGuard`, sem `PermissionGuard` e sem `x-org-key`.
Ao rejeitar, a API preenche `rejectedAt` e `rejectedBy`. A rejeição é terminal:
o mesmo token não pode ser aceito depois. Repetir a rejeição deve devolver a
mesma resposta uniforme de convite indisponível.

Como o convite é portável e de uso único, a rejeição invalida o link para
qualquer pessoa. Se futuramente a rejeição precisar afetar somente um usuário,
o convite terá de ser nominal e associado a esse usuário ou e-mail.

### Revogar convite como owner

```http
POST /org/invites/revoke
Authorization: Bearer <jwt-do-owner>
x-org-key: <organization-id>
Content-Type: application/json

{
  "inviteId": "invite-id"
}
```

Reutilizar a permissão administrativa de remoção de afiliações. O update deve
combinar `id = inviteId`, `orgkey = x-org-key`, `usedAt IS NULL`,
`rejectedAt IS NULL` e `revokedAt IS NULL`. Nunca alterar um convite procurando
somente pelo ID.

## DTO compartilhado

Preview, aceite e rejeição usam o mesmo formato:

```ts
import { IsNotEmpty, IsString } from 'class-validator';

export class OrganizationInviteTokenDTO {
  @IsString()
  @IsNotEmpty()
  token: string;
}
```

Usar classes para que o `ValidationPipe` global aplique as validações.

## Aceite e rejeição transacionais

Não implementar como `find -> create/update` em operações independentes. Duas
requisições simultâneas poderiam observar o mesmo convite como disponível.

No aceite, uma transação deve:

1. validar assinatura e expiração do token;
2. calcular `tokenHash` e localizar o convite;
3. confirmar que `orgkey` do registro é igual ao payload assinado;
4. confirmar ausência de `usedAt`, `rejectedAt` e `revokedAt`;
5. confirmar que o usuário ainda não pertence à organização;
6. reivindicar o convite com `updateMany` condicional;
7. criar `Affiliation` com o username do JWT e role `MEMBER`.

Condição central do aceite:

```ts
const claimed = await tx.organizationInvite.updateMany({
  where: {
    id: invite.id,
    usedAt: null,
    rejectedAt: null,
    revokedAt: null,
    expiresAt: { gt: now },
  },
  data: { usedAt: now },
});

if (claimed.count !== 1) {
  throw inviteUnavailable();
}
```

A criação da afiliação ocorre na mesma transação. A constraint única de
`Affiliation` continua sendo a barreira final; tratar Prisma `P2002` como
`409 Conflict`.

A rejeição usa o mesmo padrão de `updateMany`, mas grava `rejectedAt` e
`rejectedBy`. Assim, uma corrida entre aceitar e rejeitar tem exatamente um
vencedor.

## Organização dos arquivos

```text
src/modules/affiliations/
├── affiliations.module.ts
└── invites/
    ├── organization-invite.controller.ts
    ├── organization-invite.service.ts
    ├── organization-invite.repository.ts
    └── dto/
        ├── organization-invite-token.dto.ts
        └── revoke-organization-invite.dto.ts
```

O repository concentra persistência e transações. O service concentra emissão,
assinatura, verificação, hash, cálculo de expiração e erros de negócio. O
controller extrai JWT, header e body e monta `ApiResponse`.

## Frontend

A rota é:

```text
/org/join/<token>
```

Ao carregar a página:

1. extrair o token do path;
2. enviar `POST /org/invites/preview`;
3. exibir nome da organização e expiração retornados pela API;
4. exibir os botões **Aceitar** e **Rejeitar** somente se `valid` for `true`;
5. solicitar login ou cadastro antes de aceitar/rejeitar;
6. chamar o endpoint escolhido com JWT e token;
7. remover o token do estado temporário após sucesso ou erro definitivo;
8. após aceite, atualizar `GET /affiliations` e abrir a organização.

Configurar `Referrer-Policy: no-referrer` nessa página. Não enviar o token para
analytics, logs ou monitoramento. Se for necessário atravessar login/cadastro,
guardar temporariamente em `sessionStorage`, nunca em `localStorage` ou cookie
persistente.

## Cadastro de quem ainda não possui conta

Cadastro e aceite continuam como operações separadas:

```text
abrir /org/join/<token>
  -> consultar e mostrar o convite
  -> preservar o token temporariamente
  -> criar Account e User
  -> autenticar e receber JWT
  -> voltar à confirmação
  -> aceitar ou rejeitar com JWT
```

O token não deve ser enviado para `/accounts/register`, `/users` ou
`/auth/login`. A conta continua válida se o convite expirar durante o cadastro.

Uma evolução independente pode unificar o cadastro em `POST /auth/register`,
mas isso não muda os endpoints nem as responsabilidades do convite.

## Segurança e regras de negócio

- Usar segredo de assinatura específico para convites e mantê-lo fora do código.
- Não confiar em payload apenas decodificado; sempre verificar assinatura.
- Comparar o `orgkey` assinado com o `orgkey` persistido.
- Persistir somente SHA-256 do token bruto.
- Nunca registrar token, hash ou URL completa.
- Fixar a role `MEMBER` no backend.
- Exigir HTTPS no frontend e na API em produção.
- Aplicar rate limit em preview, aceite e rejeição.
- Devolver erro uniforme para token aleatório, expirado, usado, rejeitado ou revogado.
- Usar `onDelete: Cascade` para remover convites quando a organização for excluída.
- Não consumir convite por `GET`.
- Não aceitar `orgkey`, role, expiração ou validade enviados pelo cliente.

## Casos de teste mínimos

### Criação e responsabilidade do link

- owner correto gera token: `201`;
- `MANAGER` e `MEMBER` recebem `403`;
- owner de outra organização alterando `x-org-key` recebe `403`;
- resposta contém `token` e `expiresAt`, mas não contém `url`;
- backend não depende de `WEB_APP_URL`, `Host` ou `Origin`;
- frontend monta `/org/join/<token>` usando sua própria URL.

### Preview

- token disponível devolve `valid: true`, expiração e dados públicos da organização;
- token adulterado não é aceito mesmo que contenha um `orgkey` existente;
- token expirado, usado, rejeitado ou revogado devolve estado indisponível;
- preview não consome nem altera o convite.

### Aceite

- aceite sem JWT recebe `401`;
- aceite não exige `x-org-key`;
- token válido cria `Affiliation` com username do JWT e role `MEMBER`;
- usuário já afiliado recebe `409` e não consome o convite;
- segundo uso do mesmo token falha;
- token bruto não aparece no banco.

### Rejeição e revogação

- rejeição sem JWT recebe `401`;
- rejeição válida grava `rejectedAt` e `rejectedBy`;
- token rejeitado não pode ser aceito;
- owner pode revogar convite disponível da própria organização;
- owner não pode revogar convite de outra organização;
- convite consumido, rejeitado ou revogado não muda novamente de estado.

### Concorrência

- dois aceites simultâneos geram exatamente uma afiliação;
- aceite e rejeição simultâneos têm exatamente um vencedor;
- falha ao criar a afiliação desfaz a alteração de `usedAt`;
- duas requisições da mesma conta não criam duplicidade.

## Ordem recomendada de implementação

1. Adicionar model e migration.
2. Implementar assinatura/verificação e persistência do hash.
3. Implementar preview e testar validação do token.
4. Implementar aceite e rejeição transacionais, inclusive concorrência.
5. Implementar criação e revogação com autorização de owner.
6. Registrar controller, service e repository no `AffiliationModule`.
7. Criar a página frontend `/org/join/<token>` e montar o link no frontend.
8. Configurar rate limit e, opcionalmente, audit log.

## Referências

- [OWASP — Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html): expiração, uso único, armazenamento seguro, rate limiting e prevenção de vazamento de tokens em URLs.
- [Node.js — `crypto.createHash`](https://nodejs.org/api/crypto.html#cryptocreatehashalgorithm-options): hash do token antes da persistência.
