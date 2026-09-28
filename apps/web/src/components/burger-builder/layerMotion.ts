import type { TargetAndTransition, Transition } from "motion/react";
import type { PositionedLayer } from "@/burger/stackLayout";

const ENTRY_DROP_DISTANCE = 56;
const ENTRY_TILT_DEGREES = -3;
const EXIT_SINK_DISTANCE = 10;
const EXIT_SCALE = 0.85;
const EXIT_DURATION_SECONDS = 0.22;
const EXIT_EASE_IN_QUAD = [0.55, 0.085, 0.68, 0.53] as const;
const BUN_SETTLE_START_SCALE = 0.94;

export const layerSpring: Transition = { type: "spring", stiffness: 320, damping: 26, mass: 1 };

export function enteringLayerState(layer: PositionedLayer): TargetAndTransition {
  return { y: -(layer.bottom + ENTRY_DROP_DISTANCE), rotate: ENTRY_TILT_DEGREES, opacity: 0 };
}

export function restingLayerState(layer: PositionedLayer): TargetAndTransition {
  return { y: -layer.bottom, rotate: 0, opacity: 1, scale: 1 };
}

export function leavingLayerState(layer: PositionedLayer): TargetAndTransition {
  return {
    y: -layer.bottom + EXIT_SINK_DISTANCE,
    scale: EXIT_SCALE,
    opacity: 0,
    transition: { duration: EXIT_DURATION_SECONDS, ease: EXIT_EASE_IN_QUAD },
  };
}

export const bunSettleKeyframes = { scale: [BUN_SETTLE_START_SCALE, 1] };
