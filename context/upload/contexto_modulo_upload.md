# Contexto do módulo Upload

## Estado de registro

`UploadModule` está importado diretamente no `AppModule`. Portanto,
`POST /upload/image` fica disponível na aplicação executada.

## Endpoint declarado

| Método | Rota | Autenticação | Content-Type | Status | `data` |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/upload/image` | Bearer JWT | `multipart/form-data` | `201` | `ImageDTO` |

Campos da requisição:

```text
image: File              obrigatório; MIME deve iniciar com image/
Header User: <username>  usado como userkey no banco
```

Exemplo no frontend:

```ts
const form = new FormData();
form.append("image", file);

await api.post("/upload/image", form, {
  headers: { User: username },
});
```

Não defina manualmente o boundary do `Content-Type`; deixe o cliente HTTP/navegador montá-lo.

## DTOs

DTO interno usado ao persistir:

```ts
interface CreateImageDTO {
  filename: string;
  url: string;
  userkey: string; // User.username
}
```

Forma efetiva do retorno Prisma:

```ts
interface ImageDTO {
  id: string;
  filename: string;
  url: string;
  userkey: string;
  created_at: string;
  updated_at: string;
}
```

O retorno usa `ApiResponse<ImageDTO>`. A imagem é enviada ao bucket Supabase e a URL pública é persistida.

## Limitações e segurança

- O ator é recebido do header `User`, não extraído do JWT; isso permite tentar associar imagem a outro usuário. O backend deve usar `CurrentAccount.username`.
- Só há filtro por MIME; não existe limite de tamanho declarado no interceptor.
- `Image.userkey` é único: um usuário só pode possuir um registro de imagem. Novo upload sem substituir/remover o anterior pode falhar.
- Se a persistência no banco falhar depois do upload, o arquivo remoto pode ficar órfão.
- Não há endpoint público de remoção, apesar de o repository possuir `delete()`.
