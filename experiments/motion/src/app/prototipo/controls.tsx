"use client";

// Controles do microprotótipo.
// Propositalmente IDÊNTICO nos três experimentos: não contém animação.

import { useEffect, useRef } from "react";
import { MAX_LAYERS, STRESS_INTERVAL_MS, STRESS_SEQUENCE, type Action } from "./layers";

type ControlsProps = {
  count: number;
  onAction: (action: Action) => void;
};

export function Controls({ count, onAction }: ControlsProps) {
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function runStress() {
    STRESS_SEQUENCE.forEach((action, step) => {
      timers.current.push(window.setTimeout(() => onAction(action), step * STRESS_INTERVAL_MS));
    });
  }

  return (
    <div className="controls">
      <button onClick={() => onAction("add")} disabled={count >= MAX_LAYERS}>
        Adicionar
      </button>
      <button onClick={() => onAction("remove")} disabled={count === 0}>
        Remover do meio
      </button>
      <button onClick={() => onAction("reverse")} disabled={count < 2}>
        Inverter ordem
      </button>
      <button onClick={() => onAction("reset")}>Resetar</button>
      <button onClick={runStress}>Estresse ({STRESS_SEQUENCE.length} ações rápidas)</button>
      <span className="count">
        {count}/{MAX_LAYERS} camadas
      </span>
    </div>
  );
}
