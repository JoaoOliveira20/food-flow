import type { AdminPreset } from "@/api/admin/types";

export type PresetStatus = "initial" | "published" | "hidden" | "unavailable";

type PresetState = Pick<AdminPreset, "isInitial" | "isVisible" | "isAvailable">;

export function presetStatus(preset: PresetState): PresetStatus {
  if (preset.isInitial) return "initial";
  if (!preset.isVisible) return "hidden";
  return preset.isAvailable ? "published" : "unavailable";
}

export const PRESET_STATUS_LABELS: Record<PresetStatus, string> = {
  initial: "Composição inicial",
  published: "Publicado",
  hidden: "Oculto",
  unavailable: "Indisponível",
};

export const PRESET_STATUS_DESCRIPTIONS: Record<PresetStatus, string> = {
  initial: "Composição inicial: o hambúrguer que aparece ao abrir o montador (não entra no painel de presets).",
  published: "Publicado: aparece no painel de presets do montador.",
  hidden: "Oculto: só aparece aqui no admin até você publicar.",
  unavailable: "Publicado, mas fora do montador: leva pão ou ingrediente oculto.",
};
