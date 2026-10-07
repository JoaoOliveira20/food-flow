"use client";

import Link from "next/link";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { FieldError } from "./FieldError";
import { Icon } from "./Icon";
import { StatusPill } from "./StatusPill";
import styles from "./admin.module.css";

type StudioBarProps = {
  backHref: string;
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
  backHref,
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
  const formRef = useRef<HTMLFormElement>(null);
  const canSave = !isSaving && (isNew || isDirty);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (canSave) formRef.current?.requestSubmit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canSave]);

  return (
    <form ref={formRef} className={styles.studioBar} onSubmit={onSubmit} noValidate>
      <div className={styles.studioIdentity}>
        <input
          id="studio-name"
          className={`${styles.titleInput} ${nameErrors ? styles.inputInvalid : ""}`}
          value={name}
          maxLength={100}
          placeholder={namePlaceholder}
          aria-label={nameLabel}
          aria-invalid={nameErrors ? true : undefined}
          aria-describedby={nameErrors ? "studio-name-error" : undefined}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <div className={styles.studioMeta} aria-live="polite">
          {badges}
          {isDirty ? (
            <StatusPill tone="pending">Alterações não salvas</StatusPill>
          ) : (
            !isNew && <StatusPill tone="plain">Tudo salvo</StatusPill>
          )}
        </div>
        <FieldError id="studio-name-error" messages={nameErrors} />
      </div>

      <div className={styles.studioActions}>
        <Link href={backHref} className={styles.buttonGhost}>
          <Icon name="arrowLeft" />
          <span className={styles.buttonLabel}>Voltar</span>
        </Link>
        <button type="button" className={styles.buttonGhost} onClick={onUndo} disabled={!isDirty || isSaving}>
          <Icon name="undo" />
          <span className={styles.buttonLabel}>{undoLabel ?? (isNew ? "Limpar" : "Desfazer")}</span>
        </button>
        {extraActions}
        <button type="submit" className={styles.buttonPrimary} disabled={!canSave} title="Ctrl S">
          {isSaving ? "Salvando…" : isNew ? createLabel : "Salvar"}
        </button>
      </div>

      <div className={styles.studioMessages}>{messages}</div>
    </form>
  );
}
