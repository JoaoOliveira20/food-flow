# Food Flow — Asset Analysis

Status: ⏳ **Pendente**

Este documento vai registrar a análise dos assets de ingredientes: dimensões, recortes, pontos de ancoragem, espessura visual e consistência entre as imagens.

Os 21 PNGs estão em `apps/web/public/assets/ingredients/` (verificado em 28/09/2026). A direção artística decidida é o estilo fotográfico dos PNGs atuais (`OPEN_DECISIONS.md` §12). A análise detalhada descrita acima ainda não foi feita.

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
