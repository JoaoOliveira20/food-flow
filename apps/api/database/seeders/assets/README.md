# Imagens dos dados iniciais

Imagens usadas pelo `BurgerCatalogSeeder` para criar o conteúdo inicial do montador. Elas são gravadas pelo Storage
como um upload (nome gerado, dimensões lidas do arquivo); a aplicação nunca as serve a partir desta pasta.
Novos ingredientes são cadastrados pelo admin, não aqui.

Regras (as mesmas que o admin orienta e a API valida — `docs/ASSET_ANALYSIS.md`, BD-10):

- **Formato:** PNG com canal alfa (fundo transparente), recorte limpo.
- **Um arquivo por camada/variante** — nada de sprites ou composições prontas.
- **Nomes:** `kebab-case`, em inglês, no padrão `<item>[-<parte>][-<variante>].png`.
  Exemplos: `bun-top-classic.png`, `bun-bottom-classic.png`, `beef-patty.png`.
- **Consistência:** mesmo estilo, iluminação, ângulo de câmera e escala relativa
  entre todos os ingredientes (ver `docs/DOMAIN_DECISIONS.md`, seções 7 e 8).
