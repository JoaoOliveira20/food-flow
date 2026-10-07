"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/api/admin/mutations";
import type { AdminPresetReference } from "@/api/admin/types";
import { Icon } from "./Icon";
import { useToast } from "./shell/Toaster";
import styles from "./admin.module.css";

type DeleteCardProps = {
  title: string;
  hint: string;
  question: string;
  deletedMessage: string;
  listHref: string;
  blockedReason?: ReactNode;
  onDelete: () => Promise<unknown>;
};

export function DeleteCard({ title, hint, question, deletedMessage, listHref, blockedReason, onDelete }: DeleteCardProps) {
  const router = useRouter();
  const toast = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockingPresets, setBlockingPresets] = useState<AdminPresetReference[]>([]);

  async function confirmDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete();
      toast({ tone: "success", title: deletedMessage });
      router.push(listHref);
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
    <section className={styles.danger} aria-labelledby="delete-title">
      <div className={styles.dangerBody}>
        <div>
          <h2 id="delete-title">{title}</h2>
          <p>{blockedReason ?? hint}</p>
        </div>
        {isConfirming && (
          <div className={styles.confirm} role="group" aria-labelledby="delete-confirmation">
            <p id="delete-confirmation">{question}</p>
            <div className={styles.actions}>
              <button type="button" className={styles.button} onClick={() => setIsConfirming(false)} disabled={isDeleting}>
                Cancelar
              </button>
              <button type="button" className={styles.buttonDanger} onClick={confirmDelete} disabled={isDeleting} autoFocus>
                {isDeleting ? "Excluindo…" : "Excluir definitivamente"}
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className={styles.alert} role="alert">
            <Icon name="alert" />
            <div>
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
          </div>
        )}
      </div>
      {!blockedReason && !isConfirming && (
        <button type="button" className={styles.button} onClick={() => setIsConfirming(true)}>
          <Icon name="trash" />
          Excluir…
        </button>
      )}
    </section>
  );
}
