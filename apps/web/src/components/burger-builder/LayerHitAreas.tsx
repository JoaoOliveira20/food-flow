import type { PointerEvent } from "react";
import type { PositionedLayer } from "@/burger/stackLayout";
import styles from "./burgerBuilder.module.css";

const HIT_AREA_WIDTH_RATIO = 0.9;

type LayerHitAreasProps = {
  layers: PositionedLayer[];
  selectedInstanceId: string | null;
  onSelectLayer: (instanceId: string) => void;
  onLayerPointerDown: (event: PointerEvent, instanceId: string) => void;
};

export function LayerHitAreas({ layers, selectedInstanceId, onSelectLayer, onLayerPointerDown }: LayerHitAreasProps) {
  return layers.map((layer) => {
    if (!layer.hitArea) return null;
    const width = layer.width * HIT_AREA_WIDTH_RATIO;
    return (
      <button
        key={layer.key}
        className={styles.hitArea}
        style={{
          width,
          marginLeft: -width / 2,
          height: layer.hitArea.height,
          transform: `translateY(${-layer.hitArea.bottom}px)`,
        }}
        aria-label={`Selecionar ${layer.name}`}
        aria-pressed={layer.key === selectedInstanceId}
        onPointerDown={(event) => onLayerPointerDown(event, layer.key)}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => {
          event.stopPropagation();
          onSelectLayer(layer.key);
        }}
      />
    );
  });
}
