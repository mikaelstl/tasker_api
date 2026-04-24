<div align="center">
  <img src="https://raw.githubusercontent.com/mikaelstl/tasker_app/develop/public/app_logo.png" width="124"/>

  # Tasker API
</div>

![status](https://img.shields.io/badge/status-em_desenvolvimento-blue)

Tasker é uma ferramenta de gestão de projetos e equipes, voltado para ambientes organizacionais e escolares, onde análise de desempenho é um fator altamente presente. Desenvolvido com Node.JS, ReactJS e NestJS.

### Requisitos

* [Node.js](https://nodejs.org/en/):20+
* [PostgreSQL](https://www.postgresql.org/) ou [Docker](https://www.docker.com/)

#### Estrutura do ENV
```bash
# Database Settings
DB_URL = "postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO?schema=public"
DB_DIALECT = postgres

# API Settings
API_PORT = {porta}

#API Keys
SECRET = "sua_key"
```

> [!IMPORTANT]
> Remova as chaves ({}).

### Principais Bibliotecas

- [NestJs](https://nestjs.com/) - biblioteca para estruturação da API, controllers, services e injeção de dependências.
- [Prisma](https://www.prisma.io/) - ORM para conexão com banco de dados.
- [@supabase/supabase-js](https://supabase.com/docs/reference/javascript/installing) - biblioteca para conexão com bancos e stores em nuvem.
- [bcrypt](https://www.npmjs.com/package/bcrypt) - biblioteca para encriptação de dados.
- [multer](https://www.npmjs.com/package/multer) - biblioteca para tratamento e upload de arquivos.
- [nanoid](https://www.npmjs.com/package/nanoid) - biblioteca utilizada para gerar códigos de identificação personalizados.
- [class-validator](https://www.npmjs.com/package/class-validator) - biblioteca de validação de dados, utilizada para garantir integridade de dados enviados nas rotas.

#### Autenticação
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - biblioteca para estruturação e tipagem de tokens JWT.
- [@nestjs/jwt](https://www.npmjs.com/package/@nestjs/jwt) - biblioteca de integração e manipulação de tokens JWT para NestJs.
- [passport-jwt](https://www.npmjs.com/package/passport-jwt) - biblioteca para auxiliar na autenticação de rotas utilizando JWT.

## Autenticação

Esta API utiliza de tokens JWT para autenticação dentro do sistema. para garantir a segurança dos dados.

### Fluxo

Para obter o token JWT, é necessário seguir os seguintes passos.

**POST** `/auth/login`

Para a rota `/login` é necessário enviar o seguinte objeto.
```json
{
  "email": "email_registrado@email.com",
  "senha": "sua_senha"
}
```

Com os dados enviados com sucesso. O sistema irá retornar um objeto no seguinte modelo. 

```json
{
	"account": "id_sua_conta",
	"email": "email_registrado@email.com",
	"access_token": "seu_token_gerado"
},
```

**Enviando o token na requisição**

A API segue a padronização de envio de tokens via Header da requisição. Seguindo o seguinte modelo:

```bash
  Authorization: Bearer <seu_token_jwt_aqui>
```

### Autorização

Esta API é baseada em autorização de usuários por role e ABAC (Attribute Based Authorization Control), ou seja, cada usuário poderá somente realizar tarefas de acordo com seu cargo (Role) em uma organização e suas permissões.

Para que o sistema identifique suas permissões e seu perfil (Role) é necessário enviar o ID da organização via Headers da requisição. Seguindo o seguinte padrão:

```bash
  X-Org-Key: <id_da_organização>
```

## Endpoints

#### Contas (`/accounts`)

| Método | Endpoint | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Cria uma nova conta | - |
| `DELETE` | `/del/:id` | Remove uma conta por ID | Sim |

#### Usuários (`/users`)

| Método | Endpoint | Descrição | Autenticação |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Cria um novo usuário | - |
| `GET` | `/` | Lista todos os usuários | - |
| `GET` | `/:username` | Retorna usuário com _username_ equivalente | - |
| `DELETE` | `/del/:username` | Remove um usuário pelo seu _username_ | - |

> [!IMPORTANT]
> Este endpoint ainda não possui autenticação, usar com CUIDADO.

### Padrão de Respostas

A API segue um sistema de tipagem dos dados para respostas e exceções. Onde o resultado de consultas a bancos de dados ou mensagens de erro estão contidos dentro deste objeto.

Este modelo foi escolhido para garantir uma padronização geral, pensando principalmente no tratamento destes dados no front-end.

**RESPONSE**

Para resposes da API, o sistema retorna um objeto contendo as seguintes informações. 

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `status` | `number` | Código de status HTTP (ex: 200, 201). |
| `data` | `any` | O corpo da resposta. Contém o objeto solicitado ou null. |
| `message` | `string` | Mensagem legível descrevendo o resultado da operação. |
| `timestamp` | `string` | Data e hora da requisição no formato ISO 8601 UTC. |
| `path` | `string` | O endpoint que foi chamado na requisição. |

Exemplo de resposta:
  ```json
  {
    "status": 201,
	  "data": {
      "id": "cmnxaeswa0004mdloig80axou",
	  	"name": "org.tasker",
	  	"ownerkey": "mikaelst",
	  	"created_at": "2026-04-13T14:27:54.442Z",
	  	"updated_at": "2026-04-13T14:27:54.442Z"
	  },
	  "message": "Organization created with success",
	  "timestamp": "2026-04-13T14:27:54.598Z",
	  "path": "/org"
  }
  ```
> [!IMPORTANT]
> Este objeto será retornado somente em casos de sucesso.

**ERROR**

Caso a API retorne um erro ou uma exceção, o objeto irá conter as seguintes informações. 

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `status` | `number` | Código de status HTTP (ex: 401, 403, 500). |
| `errors` | `Error` | Os erros ocorridos na requisição. Contém um conjunto de objetos (Padrão da API). |
| `timestamp` | `string` | Data e hora da requisição no formato ISO 8601 UTC. |
| `path` | `string` | O endpoint que foi chamado na requisição. |

**Interface Error**

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `level` | `ErrorLevel` | Representa gravidade do erro (ex: Aviso, Erro Interno, Validação). |
| `message` | `string` | Mensagem legível descrevendo o erro ocorrido. |
| `error` | `string` | Texto pequeno indicando o tipo de erro ocorrido. |

**Níveis de Erro**

| Nível | Descrição |
| :--- | :--- |
| `warning` | Avisos comuns relacionados aos dados enviados pelo usuário |
| `error` | Erros gerais da API (ex: Dado não encontrado, Dado já existente, Senha ou Login incorreto) |
| `critical` | Utilizado para indicar erros internos (ex: Internal Error - 500) |
| `validation` | Erros de validação em Bancos de Dados (ex: Colisão de Chaves, Violação de Chaves Estrangeiras) |
| `info` | Não utilizado na API (Somente padronizado com o Front-end) |

Exemplo de erro:
  ```json
  {
  	"status": 403,
  	"errors": [
  		{
  			"level": "error",
  			"message": "You don't have permission to perform this action.",
  			"error": "Forbidden"
  		}
  	],
  	"timestamp": "2026-04-23T12:07:07.942Z",
  	"path": "/project"
  }
  ```

### Organização do Projeto

| Pasta | Descrição |
| :--- | :--- |
| `app` | Contém os arquivos e classes referentes a organização e configuração padrão da API em geral |
| `config` | Arquivos de configuração de variáveis de ambiente e geração e conexão com *clients* externos |
| `database` | Contém classes para configuração e conexão com o Prisma ou outro sistema ORM |
| `decorators` | Contém *decorators* personalizados para lidar com meta-dados da API |
| `guards` | Guarda *route guards* personalizados para lidar com acessos a rotas, tratamento de dados, etc |
| `modules` | O coração da aplicação, onde são guardados os módulos e classes referentes a cada recurso da aplicação (ex: Projects, Tasks, Accounts, ...) |
| `permissions` | Contém os arquivos e classes para tratamento de permissões |
| `policy` | Arquivos para descrever como cada ação de usuário deve ser executada |
| `security` | Arquivos para manipulação e geração dos tokens JWT |
| `utils` | Utilitários do sistema (ex: Enums, Exceptions personalizadas, Http Filters, Interfaces/Types globais e funções globais) |

### Scripts Importantes

| Comando | Descrição | Como usar? |
| :--- | :--- | :--- |
| `npm run prisma:generate` | Gera o Prisma Client com as tipagens do TypeScript. | Após qualquer alteração no schema ou após instalar o projeto. |
| `npm run migrate` | Sincroniza o schema com o banco sem criar arquivos de migration. | Para geração dos tabelas no banco em ambiente de desenvolvimento. |
| `npm run migrate:new -- <nome>` | Cria uma nova migration e a aplica imediatamente. | Sempre que alterar o arquivo `schema.prisma` |
| `npm run migrate:deploy` | Aplica todas as migrations pendentes no banco. | Usado em ambientes de Produção ou Staging. |
| `npm run migrate:reset` | Apaga todos os dados, remove as tabelas e roda as migrations do zero. | Quando precisar de um banco limpo (cuidado: apaga tudo!). |

## Executando

Para interessados em estudar e observar o funcionamento da aplicação em sua máquina. Siga os passos.

#### Clone o repositório

**HTTPS**
```bash
git clone https://github.com/mikaelstl/komik-web.git
cd komik-web
```

**SSH**
```bash
git clone git@github.com:mikaelstl/komik-web.git
cd komik-web
```

#### Instale as dependências

```bash
npm i
```

#### Gere as tabelas e o PrismaClient

```bash
npm run prisma:generate

npm run migrate
```

#### Inicie o projeto

```bash
npm start
```
A aplicação estará disponível em: [https://localhost:3000](https://localhost:3000)

> [!IMPORTANT]
> Para este projeto é necessário utilização de um banco de dados Postgres (Docker ou Servidor dedicado, adicione a URL para o banco dentro do ENV conforme passo descrito na seção [Estrutura do ENV](#estrutura-do-env)).

## Licença

Komik é licenciado sob a [Licença MIT](https://github.com/mikaelstl/tasker_api/blob/main/LICENSE)