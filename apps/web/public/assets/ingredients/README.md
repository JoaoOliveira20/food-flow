# Assets de ingredientes

Este diretório recebe as imagens individuais de cada camada da composição.

Regras:

- **Formato:** PNG com canal alfa (fundo transparente), recorte limpo.
- **Um arquivo por camada/variante** — nada de sprites ou composições prontas.
- **Nomes:** `kebab-case`, em inglês, no padrão `<item>[-<parte>][-<variante>].png`.
  Exemplos: `bun-top-classic.png`, `bun-bottom-classic.png`, `beef-patty.png`,
  `cheddar.png`, `lettuce.png`, `tomato.png`, `bacon.png`.
- **Consistência:** mesmo estilo, iluminação, ângulo de câmera e escala relativa
  entre todos os ingredientes (ver `docs/DOMAIN_DECISIONS.md`, seções 7 e 8).

Não adicione imagens provisórias com nomes definitivos. Cada imagem nova também precisa de uma
entrada no catálogo (`src/burger/burgerCatalog.ts`).
