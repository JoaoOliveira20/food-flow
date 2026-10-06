# @food-flow/api

API do Food Flow (Laravel 13, PHP 8.4, MySQL 8.4). Fonte de verdade de ingredientes, presets, montadores, imagens e
visibilidade. Decisões: `docs/BACKEND_DECISIONS.md`; arquitetura: `docs/ARCHITECTURE.md`; tarefas: `docs/TASKS.md`.

PHP, Composer e MySQL rodam apenas em containers gerenciados pelo [Kool](https://kool.dev) (Docker). Nada de PHP
instalado no Windows ou no WSL.

## Primeira vez

```bash
cd apps/api
kool run setup        # copia .env, sobe os containers, instala dependências, gera a chave, storage:link e migrations
```

## Dia a dia

```bash
kool start            # ou, na raiz: pnpm dev:api   → http://localhost:8000 (saúde: /up)
kool stop             # ou, na raiz: pnpm stop:api
kool run artisan ...  # comandos do Artisan
kool run composer ... # Composer
kool run test         # testes (PHPUnit) no banco food_flow_testing; na raiz: pnpm test:api
kool run pint         # formatação (Laravel Pint)
kool run reset        # recria o banco com os dados iniciais
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
