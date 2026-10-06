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

  function change(text: string) {
    const parsed = Number(text);
    if (text !== "" && Number.isFinite(parsed)) onChange(parsed);
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.rangeRow}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={`${label} (controle deslizante)`}
          onChange={(event) => change(event.target.value)}
        />
        <input
          id={id}
          type="number"
          className={`${styles.input} ${errors ? styles.inputInvalid : ""}`}
          min={min}
          max={max}
          step={step}
          value={value}
          aria-describedby={errors ? `${helpId} ${errorId}` : helpId}
          aria-invalid={errors ? true : undefined}
          onChange={(event) => change(event.target.value)}
        />
      </div>
      <p id={helpId} className={styles.help}>
        {help}
      </p>
      <FieldError id={errorId} messages={errors} />
    </div>
  );
}
