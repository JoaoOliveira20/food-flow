"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { FieldError } from "./FieldError";
import styles from "./admin.module.css";

type StudioBarProps = {
  nameLabel: string;
  namePlaceholder: string;
  name: string;
  nameErrors: string[] | undefined;
  onNameChange: (name: string) => void;
  badges: ReactNode;
  isNew: boolean;
  isDirty: boolean;
  isSaving: boolean;
  createLabel: string;
  undoLabel?: string;
  onUndo: () => void;
  extraActions?: ReactNode;
  messages?: ReactNode;
  onSubmit: (event: FormEvent) => void;
};

export function StudioBar({
  nameLabel,
  namePlaceholder,
  name,
  nameErrors,
  onNameChange,
  badges,
  isNew,
  isDirty,
  isSaving,
  createLabel,
  undoLabel,
  onUndo,
  extraActions,
  messages,
  onSubmit,
}: StudioBarProps) {
  return (
    <form className={styles.studioBar} onSubmit={onSubmit} noValidate>
      <div className={styles.studioName}>
        <label className={styles.label} htmlFor="studio-name">
          {nameLabel}
        </label>
        <input
          id="studio-name"
          className={`${styles.input} ${nameErrors ? styles.inputInvalid : ""}`}
          value={name}
          maxLength={100}
          placeholder={namePlaceholder}
          aria-invalid={nameErrors ? true : undefined}
          aria-describedby={nameErrors ? "studio-name-error" : undefined}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <FieldError id="studio-name-error" messages={nameErrors} />
      </div>

      <div className={styles.studioStatus} aria-live="polite">
        {badges}
        {isDirty ? (
          <span className={`${styles.badge} ${styles.badgeWarning}`}>Alterações não salvas</span>
        ) : (
          !isNew && <span className={`${styles.badge} ${styles.badgeVisible}`}>Salvo</span>
        )}
      </div>

      <div className={styles.studioActions}>
        <Link href="/admin" className={styles.button}>
          Voltar
        </Link>
        <button type="button" className={styles.button} onClick={onUndo} disabled={!isDirty || isSaving}>
          {undoLabel ?? (isNew ? "Limpar" : "Desfazer alterações")}
        </button>
        {extraActions}
        <button type="submit" className={styles.buttonPrimary} disabled={isSaving || (!isNew && !isDirty)}>
          {isSaving ? "Salvando…" : isNew ? createLabel : "Salvar"}
        </button>
      </div>

      <div className={styles.studioMessages}>{messages}</div>
    </form>
  );
}
