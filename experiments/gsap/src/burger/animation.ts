// Valores de referência das animações.
//
// Arquivo IDÊNTICO nos três experimentos. Cada BurgerStage.tsx traduz estes
// valores para o modelo da sua biblioteca; diferenças inevitáveis estão
// comentadas lá e no README do experimento.

// Entrada: a camada surge um pouco acima da posição final, levemente girada.
export const ENTER_OFFSET_Y = 56;
export const ENTER_ROTATION = -3;

// Saída: encolhe um pouco, desce levemente e desaparece.
export const EXIT_SCALE = 0.85;
export const EXIT_OFFSET_Y = 10;
export const EXIT_DURATION_S = 0.22;
// Curva da saída: "ease-in quadrática" nas três bibliotecas.
// Motion usa esta curva de Bézier; GSAP usa "power1.in"; React Spring usa
// easings.easeInQuad. (Antes: Motion "easeIn" cúbica, React Spring linear.)
export const EXIT_EASE_BEZIER = [0.55, 0.085, 0.68, 0.53] as const;

// Troca de variante de pão: pequeno "assentamento" do pão.
export const BUN_SWAP_SCALE = 0.94;

// Spring de referência (modelo massa-mola). Motion usa stiffness/damping;
// React Spring usa tension/friction com o mesmo significado.
// Razão de amortecimento ≈ 0,73: ultrapassa pouco o alvo e assenta rápido.
export const SPRING = { stiffness: 320, damping: 26, mass: 1 };

// GSAP não tem spring nativo: aproximação por duração + ease com leve overshoot.
export const TWEEN_APPROX = { duration: 0.55, ease: "back.out(1.3)" };
