// Faixas clicáveis das camadas. Arquivo IDÊNTICO nos três experimentos.
//
// As caixas dos PNGs se sobrepõem (é o que faz o hambúrguer parecer compacto),
// então clicar na imagem selecionaria a camada errada. Cada camada ganha uma
// faixa própria, sem sobreposição, na posição FINAL (não animada). Também
// torna a seleção acessível por teclado. As faixas também iniciam o arraste.

import type { PointerEvent } from "react";
import type { PositionedLayer } from "@/burger/layout";
import styles from "./builder.module.css";

type HitAreasProps = {
  layers: PositionedLayer[];
  selectedUid: string | null;
  onSelect: (uid: string) => void;
  onPointerDown: (event: PointerEvent, uid: string) => void;
};

export function HitAreas({ layers, selectedUid, onSelect, onPointerDown }: HitAreasProps) {
  return layers.map((layer) =>
    layer.hit ? (
      <button
        key={layer.key}
        className={styles.hitArea}
        style={{
          width: layer.width * 0.9,
          marginLeft: -(layer.width * 0.9) / 2,
          height: layer.hit.height,
          transform: `translateY(${-layer.hit.bottom}px)`,
        }}
        aria-label={`Selecionar ${layer.name}`}
        aria-pressed={layer.key === selectedUid}
        onPointerDown={(event) => onPointerDown(event, layer.key)}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(layer.key);
        }}
      />
    ) : null,
  );
}
