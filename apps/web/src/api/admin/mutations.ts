import { browserApiUrl } from "../config";
import type { AdminIngredient, AdminPreset, AdminPresetReference } from "./types";

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: FieldErrors = {},
    readonly presets: AdminPresetReference[] = [],
  ) {
    super(message);
  }
}

const GENERIC_MESSAGES: Record<number, string> = {
  413: "O arquivo é grande demais. Envie uma imagem de até 2 MB.",
  429: "Muitas alterações em pouco tempo. Aguarde um minuto e tente de novo.",
};

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as {
    message?: string;
    errors?: FieldErrors;
    presets?: AdminPresetReference[];
  } | null;
  const message =
    GENERIC_MESSAGES[response.status] ?? body?.message ?? "Não foi possível salvar. Tente de novo em instantes.";
  return new ApiError(message, response.status, body?.errors ?? {}, body?.presets ?? []);
}

async function request(path: string, method: string, body?: FormData | object): Promise<Response> {
  const isForm = body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${browserApiUrl()}/api${path}`, {
      method,
      headers: isForm ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("A API não respondeu. Verifique se ela está rodando (pnpm dev:api).", 0);
  }

  if (!response.ok) throw await toApiError(response);
  return response;
}

async function send<T>(path: string, method: string, body?: FormData | object): Promise<T> {
  const response = await request(path, method, body);
  const { data } = (await response.json()) as { data: T };
  return data;
}

export type IngredientFields = {
  name?: string;
  displayWidth?: number;
  restingSurfaceRatio?: number;
  sinkRatio?: number;
  isVisible?: boolean;
};

function ingredientForm(fields: IngredientFields, image: File | null, method?: "PATCH"): FormData {
  const form = new FormData();
  if (method) form.append("_method", method);
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;
    form.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  });
  if (image) form.append("image", image);
  return form;
}

export async function createIngredient(builderId: number, fields: IngredientFields, image: File): Promise<AdminIngredient> {
  return send<AdminIngredient>(`/admin/builders/${builderId}/ingredients`, "POST", ingredientForm(fields, image));
}

export async function updateIngredient(
  ingredientId: number,
  fields: IngredientFields,
  image: File | null = null,
): Promise<AdminIngredient> {
  const path = `/admin/ingredients/${ingredientId}`;
  return image
    ? send<AdminIngredient>(path, "POST", ingredientForm(fields, image, "PATCH"))
    : send<AdminIngredient>(path, "PATCH", fields);
}

export async function deleteIngredient(ingredientId: number): Promise<void> {
  await request(`/admin/ingredients/${ingredientId}`, "DELETE");
}

export type PresetFields = {
  name?: string;
  bunVariantId?: number;
  ingredientIds?: number[];
};

export async function createPreset(builderId: number, fields: PresetFields): Promise<AdminPreset> {
  return send<AdminPreset>(`/admin/builders/${builderId}/presets`, "POST", fields);
}

export async function updatePreset(presetId: number, fields: PresetFields): Promise<AdminPreset> {
  return send<AdminPreset>(`/admin/presets/${presetId}`, "PATCH", fields);
}

export async function deletePreset(presetId: number): Promise<void> {
  await request(`/admin/presets/${presetId}`, "DELETE");
}
