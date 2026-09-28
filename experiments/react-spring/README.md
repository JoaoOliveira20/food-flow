# Experimento — React Spring

Montador visual de hambúrguer animado com **React Spring** (`@react-spring/web` 10.1.2).

Faz parte da comparação de bibliotecas de animação do Food Flow. Os três experimentos
(`motion`, `gsap`, `react-spring`) têm a mesma interface, os mesmos PNGs, o mesmo
estado inicial e os mesmos valores de referência de animação. Só muda
`src/components/BurgerStage.tsx`.

## Como iniciar

```bash
pnpm dev:react-spring              # a partir da raiz → http://localhost:3003
# ou, dentro deste diretório:
pnpm dev | pnpm build | pnpm start | pnpm lint | pnpm typecheck
```

O microprotótipo da etapa anterior (três retângulos) continua em `/prototipo`.

## Funcionalidades

- Hambúrguer 2D compacto, formado por 21 PNGs independentes (cópias de
  `apps/web/public/assets/ingredients/` em `public/assets/ingredients/`).
- Adicionar: entra no topo, logo abaixo do pão superior. Duplicatas permitidas até 14 camadas.
- Selecionar uma camada tocando nela → subir, descer, duplicar, substituir, remover.
- **Arrastar e soltar** camadas para mudar a ordem (mouse e toque), e arrastar um
  ingrediente do menu direto para uma posição do hambúrguer. Os pães ficam fixos.
- Substituir: a nova camada ocupa a posição lógica da anterior.
- Trocar o pão (clássico, brioche, multigrãos, escuro) nos dois pães.
- Resetar para a composição inicial (carne, cheddar, cebola roxa, tomate, alface; pão clássico).
- Desktop em três colunas; no mobile o hambúrguer fica fixo no topo e os controles rolam por baixo.

## Como testar as animações

1. **Entrada:** adicione um ingrediente; ele desce 56 px com −3° e se acomoda sob o pão superior.
2. **Reorganização:** selecione a carne e use ↑/↓; remova uma camada do meio.
3. **Substituição:** selecione o tomate → Substituir → escolha outro ingrediente.
4. **Interrupção:** clique vários ingredientes seguidos; remova ou mova camadas enquanto
   outra ainda está entrando; troque o pão no meio de uma animação.
5. **Limite:** adicione até 14 camadas; a composição reduz a escala para caber no palco.
6. **Arraste:** arraste uma camada para cima/baixo; as vizinhas abrem espaço durante o
   gesto. Arraste um ingrediente do menu (no celular, segure ~0,3 s antes). Solte fora
   do hambúrguer ou pressione Esc para cancelar.

## Arquitetura

| Arquivo | Papel | Igual nos 3? |
| --- | --- | --- |
| `src/burger/ingredients.ts` | catálogo: PNG, tamanho, `width`, `surface`, `sink` | sim |
| `src/burger/composition.ts` | estado e ações (reducer puro) | sim |
| `src/burger/layout.ts` | posições finais da pilha a partir dos dados | sim |
| `src/burger/animation.ts` | valores de referência (deslocamento, rotação, spring) | sim |
| `src/burger/useCompositionDrag.ts` | arraste com Pointer Events (sem animação) | sim |
| `src/components/DragGhost.tsx`, `DropIndicator.tsx` | miniatura e marcadores do arraste | sim |
| `src/components/*` exceto `BurgerStage.tsx` | interface | sim |
| `src/components/BurgerStage.tsx` | **integração com a biblioteca** | não |

O empilhamento não tem regras por ingrediente: cada item declara onde a próxima camada
se apoia (`surface`) e quanto afunda na de baixo (`sink`), e `layout.ts` percorre a pilha
num único laço. A seleção usa faixas de clique invisíveis e sem sobreposição (`HitAreas.tsx`),
porque as caixas dos PNGs se sobrepõem.

## Drag and drop

- **Sem dependência:** Pointer Events nativos, código idêntico nos três experimentos.
  A API de drag and drop do HTML5 não funciona com toque. Bibliotecas como dnd-kit
  aplicam `transform` próprio nos itens, o que disputaria o controle com a biblioteca de
  animação avaliada e misturaria as duas coisas na comparação.
- **Separação de responsabilidades:** o hook `useCompositionDrag` só decide *o que* está
  sendo arrastado e *em que índice* seria inserido. O `BurgerBuilder` passa ao palco uma
  composição **prévia** com o item no lugar de destino, e a biblioteca anima as vizinhas
  abrindo espaço como uma reorganização qualquer. A miniatura que segue o ponteiro é
  posicionada direto no DOM, sem biblioteca.
- **Ponto de contato com a biblioteca:** apenas as props `layout` (prévia) e
  `draggingKey` (camada translúcida) do `BurgerStage`.
- **Regras:** o mouse começa a arrastar após 6 px; o toque numa camada também (a faixa usa
  `touch-action: none`); o toque no menu exige segurar 280 ms, para não conflitar com a
  rolagem. Soltar fora do palco, Esc, `pointercancel` ou perda de foco cancelam.
- **Feedback:** camada translúcida no lugar de destino, setas ▶ ◀ na posição, mensagem
  "Soltar entre X e Y", miniatura semitransparente ao lado do cursor (acima do dedo) e
  aviso ✓/↺ ao concluir ou cancelar. Nenhum estado depende só de cor.

Comparação completa entre as três bibliotecas, com testes, medições e limitações:
[`experiments/COMPARISON.md`](../COMPARISON.md).

## Particularidades da implementação (React Spring)

- **Física de mola** (`tension`/`friction` = `stiffness`/`damping` do Motion), sem duração.
- **`useTransition`** com `keys`, `initial` (composição inicial sem entrada),
  `from`/`enter` (entrada), `update` (reorganização) e `leave` (saída). Cada fase recebe
  a camada, que já traz sua posição calculada.
- A saída com duração fixa exige `config: { duration }` dentro do próprio `leave`.
- **Interrupção sem código extra:** a mola continua da posição e velocidade atuais.
- **Escala do conjunto** com `useSpring`. **Troca de pão** com a API imperativa
  (`useSpring(() => ...)` + `api.start`), por ser um evento.
- Os valores são aplicados via `animated.div`, fora do ciclo de render do React.
- `BurgerStage.tsx`: **98 linhas**.

## Observações e limitações (React Spring)

- Verificado: mesmos cenários e resultados dos outros experimentos (dev e produção,
  desktop e mobile).
- Observado: ao remover uma camada que ainda estava entrando, o elemento invisível
  (opacidade 0) permaneceu no DOM por ~230 ms depois do fim da saída, antes de ser
  desmontado. Em Motion e GSAP ele saiu logo ao fim da animação. Não causou problema
  visual (as faixas de clique já refletem o estado novo).
- As funções de `useTransition` precisaram de anotação de tipo explícita do item.
- A saída com duração usa `easing: easings.easeInQuad`; sem ela, o padrão de `config.duration`
  é linear (corrigido para igualar às outras bibliotecas).

## Limitações comuns aos três experimentos

- **Soltura sem "pouso" animado:** ao soltar, a miniatura some e a camada translúcida
  fica opaca no lugar, sem animar da posição do ponteiro até a camada.
- Os **marcadores de inserção** não são animados e saltam de posição em posição.
- **Entrada parcialmente oculta:** a nova camada começa atrás do pão superior (que fica
  acima na ordem de profundidade) e aparece conforme o pão sobe. É coerente com "entrar
  sob o pão", mas a entrada fica menos visível nos primeiros ~100 ms.
- **Faixas de clique** ficam na posição final, sem acompanhar a animação.
- **PNGs com alfa binário** (sem bordas semitransparentes) e ~350 px de largura: o
  contorno fica levemente serrilhado e a escala máxima foi limitada a 1,25×.
- Imagens servidas com `next/image` `unoptimized` (a otimização depende do `sharp`,
  cuja compilação está desabilitada na configuração do monorepo).
- Os parâmetros `surface`/`sink` foram ajustados a olho com capturas de tela; não há
  medição automática da geometria dos PNGs.
