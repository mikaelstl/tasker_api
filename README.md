# Projeto Tasker API

Esse repositório contém código da API para a aplicação Tasker, sistema de auxílio e organização de projetos e equipes.

### Requisitos

* [Node.js](https://nodejs.org/en/):20+
* [PostgreSQL](https://www.postgresql.org/) ou [Docker](https://www.docker.com/)

#### Estrutura do ENV
```bash
# Database Configuration
DB_URL = "postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO?schema=public"
DB_USER = {seu_usuario}
DB_PASS = {sua_senha}
DB_NAME = {nome_do_banco}
DB_HOST = {host/localhost}
DB_PORT = {porta}
DB_DIALECT = postgres
#API Keys
API_PORT = {porta}
SECRET = "sua_key"
```

Remova as chaves ({}).