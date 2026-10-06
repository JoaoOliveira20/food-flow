# @food-flow/api

API do Food Flow (Laravel 13, PHP 8.4, MySQL 8.4). Fonte de verdade de ingredientes, presets, montadores, imagens e
visibilidade. Decisões: `docs/BACKEND_DECISIONS.md`; arquitetura: `docs/ARCHITECTURE.md`; tarefas: `docs/TASKS.md`.

PHP, Composer e MySQL rodam apenas em containers gerenciados pelo [Kool](https://kool.dev) (Docker). Nada de PHP
instalado no Windows ou no WSL.

## Primeira vez

```bash
cd apps/api
kool run setup        # copia .env, sobe os containers, instala dependências, gera a chave, cria o link
                      # public/storage (relativo) e roda as migrations
```

## Dia a dia

```bash
kool start            # ou, na raiz: pnpm dev:api   → http://localhost:8000 (saúde: /up)
kool stop             # ou, na raiz: pnpm stop:api
kool run artisan ...  # comandos do Artisan
kool run composer ... # Composer
kool run test         # testes (PHPUnit) no banco food_flow_testing; na raiz: pnpm test:api
kool run pint         # formatação (Laravel Pint)
kool run reset        # apaga as imagens enviadas e recria o banco com os dados iniciais (seed)
```

## Serviços (`docker-compose.yml`)

| Serviço | Imagem | Porta no host |
| --- | --- | --- |
| `app` | `kooldev/php:8.4-nginx` (PHP-FPM + nginx, roda com o UID do usuário) | `8000` (`KOOL_APP_PORT`) |
| `database` | `mysql:8.4`, volume `food-flow-api_database` | `127.0.0.1:3306` (`KOOL_DATABASE_PORT`) |

- Bancos: `food_flow` (aplicação) e `food_flow_testing` (testes, criado por `docker/mysql/initdb/`).
- Credenciais locais em `.env.example`; servem só para desenvolvimento.
- O script de criação do banco de testes só roda quando o volume é criado. Para recriar tudo do zero:
  `kool stop && docker volume rm food-flow-api_database && kool start`.

## Imagens (Storage)

- Disco configurável por `MEDIA_DISK` (padrão `public`); limites e diretórios em `config/media.php` (BD-09, BD-10).
- O banco guarda só o caminho relativo; a URL é gerada por `App\Media\ImageStorage::url()`.
- `public/storage` é um link **relativo** para `storage/app/public`, válido dentro e fora do container.
- Limites de requisição: PHP aceita até 3 MB por arquivo (4 MB por requisição) e o nginx até 4 MB, para que um
  arquivo um pouco acima de 2 MB receba erro de validação (422) e arquivos maiores sejam barrados (413).

## Dados iniciais (seed)

`database/seeders/BurgerCatalogSeeder.php` cria o montador de hambúrguer com o conteúdo que existia no frontend:
variantes de pão, ingredientes (com as formas de empilhamento), os presets Clássico, Bacon e Duplo e a composição
inicial. As imagens de origem ficam em `database/seeders/assets/` e são gravadas pelo Storage, como um upload. O
seeder não duplica dados se o montador já existir.

## Endpoints

Respostas em JSON, chaves em camelCase, envelope `data`; erros em JSON com mensagens em pt-BR (`message` e, na
validação, `errors` por campo). Decisões: `docs/BACKEND_DECISIONS.md` (BD-18).

| Método e rota | Limite | Descrição |
| --- | --- | --- |
| `GET /api/builders/{slug}` | 120/min | Catálogo público do montador |
| `GET /api/admin/builders` | 60/min | Montadores com contagens (dashboard) |
| `GET /api/admin/builders/{id}/ingredients` | 60/min | Ingredientes do montador, inclusive ocultos, com `presetsCount` |
| `POST /api/admin/builders/{id}/ingredients` | 60/min | Cria (multipart: `name`, `image`, `displayWidth`, `restingSurfaceRatio`, `sinkRatio`; `slug` e `sortOrder` opcionais); nasce oculto; 201 |
| `GET /api/admin/ingredients/{id}` | 60/min | Detalhe, com os `presets` que usam o ingrediente |
| `PATCH /api/admin/ingredients/{id}` | 60/min | Edição parcial (JSON); com nova imagem, `POST` multipart + `_method=PATCH` |
| `DELETE /api/admin/ingredients/{id}` | 60/min | 204; **409** com `presets` se estiver em uso |

`GET /api/builders/burger` devolve só o que o builder público pode usar:

```text
data.slug, data.name, data.maxLayers
data.bunVariants[]   { id, slug, name, topImage { url, width, height }, bottomImage { url, width, height } }
data.ingredients[]   só visíveis, na ordem de exibição:
                     { id, slug, name, image { url, width, height }, shape { displayWidth, restingSurfaceRatio, sinkRatio } }
data.presets[]       só disponíveis (todos os ingredientes visíveis), sem o preset inicial:
                     { id, name, bunVariantId, ingredientIds[] }   ingredientIds da base para o topo, com repetições
data.initialRecipe   { bunVariantId, ingredientIds[] } — vazia se o preset inicial estiver indisponível
```

### Erros que o cliente deve tratar

| Status | Quando | Corpo |
| --- | --- | --- |
| 404 | montador, ingrediente ou preset inexistente | `{ message }` |
| 409 | exclusão bloqueada por relação | `{ message, presets[] }` |
| 413 | requisição acima de 4 MB (barrada pelo nginx) | **HTML**, não JSON: tratar pelo status |
| 422 | validação, inclusive arquivo entre 2 e 3 MB recusado pelo PHP | `{ message, errors: { campo: [mensagens] } }` |
| 429 | limite de requisições por minuto | `{ message }` |
