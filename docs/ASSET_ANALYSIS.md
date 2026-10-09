# Food Flow — Asset Analysis

Status: 🟡 **Parcial** — inventário e diretrizes de upload registrados (06/10/2026); análise de ancoragem e espessura por imagem ainda não feita.

Este documento vai registrar a análise dos assets de ingredientes: dimensões, recortes, pontos de ancoragem, espessura visual e consistência entre as imagens.

Os 21 PNGs estavam em `apps/web/public/assets/ingredients/` (verificado em 28/09/2026); desde a T-E5 (06/10/2026) ficam em `apps/api/database/seeders/assets/` e chegam ao builder pelo Storage da API. A direção artística decidida é o estilo fotográfico dos PNGs atuais (`OPEN_DECISIONS.md` §12). A análise detalhada descrita acima ainda não foi feita.

## Molhos (29/09/2026)

Os PNGs de ketchup, mostarda e maionese foram substituídos pelo responsável por zigue-zagues horizontais.
Medido no canal alfa (limiar 40/255):

| Arquivo | Tamanho | Proporção | Área opaca na horizontal |
| --- | --- | --- | --- |
| `ketchup.png` | 1426×350 | 4,07:1 | 3,2%–96,7% |
| `mustard.png` | 1354×338 | 4,01:1 | 3,2%–96,7% |
| `mayonnaise.png` | 1389×319 | 4,35:1 | 3,2%–96,7% |

As margens transparentes são equivalentes às dos demais ingredientes (2,3%–3,2% de cada lado), então a
largura exibida (`displayWidth`) é comparável entre eles. Configuração de empilhamento: `apps/web/README.md`.

## Inventário completo e diretrizes de upload (06/10/2026)

Medido nos cabeçalhos dos 21 PNGs de `apps/web/public/assets/ingredients/`. Todos são PNG RGBA (tipo de cor 6,
com canal alfa).

| Grupo | Arquivos | Dimensões | Proporção (L:A) | Tamanho do arquivo |
| --- | --- | --- | --- | --- |
| Ingredientes | 10 (carne, queijos, bacon, alface, tomate, cebola, picles, ovo, pão do meio) | 289×156 a 407×216 | 1,7:1 a 2,4:1 | 44–129 KB |
| Molhos | 3 | 1354×338 a 1426×350 | 4,0:1 a 4,4:1 | 221–350 KB |
| Pães (topo) | 4 | 338–375 × 202–220 | 1,6:1 a 1,8:1 | 97–136 KB |
| Pães (base) | 4 | 321–345 × 141–146 | 2,2:1 a 2,5:1 | 74–86 KB |

Relação com o renderer (`apps/web/src/burger/stackLayout.ts`):

- largura exibida = `displayWidth` (240–318 na escala-base de 340) × escala do palco (no máximo 1,25), ou seja, até
  ≈ 398 px CSS; em telas 2×, ≈ 795 px físicos;
- os ingredientes atuais (289–407 px) ficam abaixo disso em telas de alta densidade; os molhos (~1400 px) sobram;
- a altura exibida vem da proporção da imagem; margens transparentes laterais de ~2–3% (medidas nos molhos) são
  o padrão; margens maiores fazem o ingrediente parecer menor que o `displayWidth`.

Limites de upload propostos a partir dessas medidas: `BACKEND_DECISIONS.md` BD-10 (🔷 aguardando confirmação).

### Texto proposto para "Dicas para uma boa imagem" no admin

> **Dicas para uma boa imagem**
>
> - Use PNG (ou WebP) com fundo transparente. Imagens com fundo não se encaixam na pilha.
> - Fotografe o ingrediente de lado, levemente de cima, como os demais (estilo fotográfico).
> - Recorte rente ao ingrediente: deixe só uma pequena margem transparente nas laterais.
> - Prefira imagens mais largas do que altas — o ingrediente é visto como uma camada.
> - Use pelo menos 800 px de largura para ficar nítido em telas de alta resolução (mínimo aceito: 280 px).
> - Arquivo de até 2 MB.
> - Mantenha iluminação e ângulo parecidos com os ingredientes existentes.
> - Confira no preview: tamanho, encaixe com as camadas vizinhas e bordas do recorte.

Os números do texto acompanham BD-10 e devem mudar junto com ele.
