# Food Flow API (Laravel)

- PHP, Composer and Artisan run **only inside the Kool containers**. Do not install PHP or Composer on the host
  (Windows or WSL) and do not follow setup instructions that suggest it. Use:
  - `kool start` / `kool stop` (from `apps/api`)
  - `kool run composer ...`, `kool run artisan ...`, `kool run test`, `kool run pint`
- Do not install packages (including Laravel Boost) without a decision recorded in `docs/BACKEND_DECISIONS.md`.
- Database: MySQL (`database` service); tests use the separate `food_flow_testing` database.
- Before changing code, read `docs/ARCHITECTURE.md`, `docs/BACKEND_DECISIONS.md`, `docs/DATA_MODEL.md` and the
  current task in `docs/TASKS.md` (repository root).
- Follow Laravel conventions; keep the code simple; validate every input in Form Requests; never trust the client.
