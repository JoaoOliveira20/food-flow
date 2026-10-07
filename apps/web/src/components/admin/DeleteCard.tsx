"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/api/admin/mutations";
import type { AdminPresetReference } from "@/api/admin/types";
import styles from "./admin.module.css";

type DeleteCardProps = {
  title: string;
  hint: string;
  question: string;
  blockedReason?: ReactNode;
  onDelete: () => Promise<unknown>;
};

export function DeleteCard({ title, hint, question, blockedReason, onDelete }: DeleteCardProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockingPresets, setBlockingPresets] = useState<AdminPresetReference[]>([]);

  async function confirmDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete();
      router.push("/admin");
      router.refresh();
    } catch (caught) {
      setIsConfirming(false);
      setError(caught instanceof ApiError ? caught.message : "Não foi possível excluir.");
      setBlockingPresets(caught instanceof ApiError ? caught.presets : []);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="delete-title">
      <h2 id="delete-title" className={styles.cardTitle}>
        {title}
      </h2>
      {blockedReason ? (
        <p className={styles.cardHint}>{blockedReason}</p>
      ) : (
        <>
          <p className={styles.cardHint}>{hint}</p>
          {isConfirming ? (
            <div className={styles.confirm} role="group" aria-labelledby="delete-confirmation">
              <p id="delete-confirmation">{question}</p>
              <div className={styles.actions}>
                <button className={styles.button} onClick={() => setIsConfirming(false)} disabled={isDeleting}>
                  Cancelar
                </button>
                <button className={styles.buttonDanger} onClick={confirmDelete} disabled={isDeleting} autoFocus>
                  {isDeleting ? "Excluindo…" : "Excluir"}
                </button>
              </div>
            </div>
          ) : (
            <button className={styles.buttonDanger} onClick={() => setIsConfirming(true)}>
              Excluir…
            </button>
          )}
        </>
      )}
      {error && (
        <div className={styles.alert} role="alert">
          {error}
          {blockingPresets.length > 0 && (
            <ul>
              {blockingPresets.map((preset) => (
                <li key={preset.id}>
                  <Link href={`/admin/presets/${preset.id}`}>{preset.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
