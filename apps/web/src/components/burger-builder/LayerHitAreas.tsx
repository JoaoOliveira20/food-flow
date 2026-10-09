import type { PointerEvent } from "react";
import { expandHitArea, type PositionedLayer } from "@/burger/stackLayout";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import styles from "./burgerBuilder.module.css";

const HIT_AREA_WIDTH_RATIO = 0.9;
const MIN_TOUCH_TARGET = 48;
const MIN_POINTER_TARGET = 24;

type LayerHitAreasProps = {
  layers: PositionedLayer[];
  stackScale: number;
  selectedInstanceId: string | null;
  onSelectLayer: (instanceId: string) => void;
  onLayerPointerDown: (event: PointerEvent, instanceId: string) => void;
};

export function LayerHitAreas({ layers, stackScale, selectedInstanceId, onSelectLayer, onLayerPointerDown }: LayerHitAreasProps) {
  const isTouch = useMediaQuery("(pointer: coarse)");
  const minHeight = stackScale > 0 ? (isTouch ? MIN_TOUCH_TARGET : MIN_POINTER_TARGET) / stackScale : 0;

  return layers.map((layer) => {
    if (!layer.hitArea) return null;
    const width = layer.width * HIT_AREA_WIDTH_RATIO;
    const hitArea = expandHitArea(layer.hitArea, minHeight);
    return (
      <button
        key={layer.key}
        className={styles.hitArea}
        style={{
          width,
          marginLeft: -width / 2,
          height: hitArea.height,
          zIndex: 100 + Math.max(0, Math.round(minHeight - layer.hitArea.height)),
          transform: `translateY(${-hitArea.bottom}px)`,
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
