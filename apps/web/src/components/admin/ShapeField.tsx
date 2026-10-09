import type { CSSProperties } from "react";
import { FieldError } from "./FieldError";
import styles from "./admin.module.css";

type ShapeFieldProps = {
  id: string;
  label: string;
  help: string;
  value: number;
  min: number;
  max: number;
  step: number;
  errors: string[] | undefined;
  onChange: (value: number) => void;
};

export function ShapeField({ id, label, help, value, min, max, step, errors, onChange }: ShapeFieldProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const fill = `${((value - min) / (max - min)) * 100}%`;

  function change(text: string) {
    const parsed = Number(text);
    if (text !== "" && Number.isFinite(parsed)) onChange(parsed);
  }

  return (
    <div className={styles.shapeField}>
      <div className={styles.shapeHeader}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          type="number"
          className={`${styles.shapeValue} ${errors ? styles.inputInvalid : ""}`}
          min={min}
          max={max}
          step={step}
          value={value}
          aria-describedby={errors ? `${helpId} ${errorId}` : helpId}
          aria-invalid={errors ? true : undefined}
          onChange={(event) => change(event.target.value)}
        />
      </div>
      <input
        type="range"
        className={styles.range}
        style={{ "--fill": fill } as CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => change(event.target.value)}
      />
      <p id={helpId} className={styles.help}>
        {help}
      </p>
      <FieldError id={errorId} messages={errors} />
    </div>
  );
}
