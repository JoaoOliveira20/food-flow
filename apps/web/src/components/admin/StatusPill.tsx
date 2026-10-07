import type { ReactNode } from "react";
import { PRESET_STATUS_LABELS, type PresetStatus } from "./presetStatus";
import styles from "./admin.module.css";

type StatusTone = "live" | "draft" | "warning" | "pending" | "plain";

const TONES: Record<StatusTone, string> = {
  live: styles.statusLive,
  draft: "",
  warning: styles.statusWarning,
  pending: styles.statusPending,
  plain: styles.statusPlain,
};

type StatusPillProps = {
  tone: StatusTone;
  children: ReactNode;
};

export function StatusPill({ tone, children }: StatusPillProps) {
  return <span className={`${styles.status} ${TONES[tone]}`}>{children}</span>;
}

const PRESET_TONES: Record<PresetStatus, StatusTone> = {
  initial: "live",
  published: "live",
  hidden: "draft",
  unavailable: "warning",
};

export function PresetStatusPill({ status }: { status: PresetStatus }) {
  return <StatusPill tone={PRESET_TONES[status]}>{PRESET_STATUS_LABELS[status]}</StatusPill>;
}

export function VisibilityPill({ isVisible }: { isVisible: boolean }) {
  return <StatusPill tone={isVisible ? "live" : "draft"}>{isVisible ? "Publicado" : "Oculto"}</StatusPill>;
}
