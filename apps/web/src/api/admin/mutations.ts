import { browserApiUrl } from "../config";
import type { AdminBunVariant, AdminIngredient, AdminPreset, AdminPresetReference } from "./types";

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

type FormFields = Record<string, string | number | boolean | undefined>;

function multipartForm(fields: FormFields, files: Record<string, File | null>, method?: "PATCH"): FormData {
  const form = new FormData();
  if (method) form.append("_method", method);
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;
    form.append(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  });
  Object.entries(files).forEach(([key, file]) => {
    if (file) form.append(key, file);
  });
  return form;
}

export async function createIngredient(builderId: number, fields: IngredientFields, image: File): Promise<AdminIngredient> {
  return send<AdminIngredient>(`/admin/builders/${builderId}/ingredients`, "POST", multipartForm(fields, { image }));
}

export async function updateIngredient(
  ingredientId: number,
  fields: IngredientFields,
  image: File | null = null,
): Promise<AdminIngredient> {
  const path = `/admin/ingredients/${ingredientId}`;
  return image
    ? send<AdminIngredient>(path, "POST", multipartForm(fields, { image }, "PATCH"))
    : send<AdminIngredient>(path, "PATCH", fields);
}

export async function deleteIngredient(ingredientId: number): Promise<void> {
  await request(`/admin/ingredients/${ingredientId}`, "DELETE");
}

export type PresetFields = {
  name?: string;
  bunVariantId?: number;
  ingredientIds?: number[];
  isVisible?: boolean;
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

export type BunVariantFields = {
  name?: string;
  isVisible?: boolean;
};

export type BunVariantImages = {
  topImage: File | null;
  bottomImage: File | null;
};

export async function createBunVariant(
  builderId: number,
  fields: BunVariantFields,
  images: { topImage: File; bottomImage: File },
): Promise<AdminBunVariant> {
  return send<AdminBunVariant>(`/admin/builders/${builderId}/bun-variants`, "POST", multipartForm(fields, images));
}

export async function updateBunVariant(
  bunVariantId: number,
  fields: BunVariantFields,
  images: BunVariantImages = { topImage: null, bottomImage: null },
): Promise<AdminBunVariant> {
  const path = `/admin/bun-variants/${bunVariantId}`;
  return images.topImage || images.bottomImage
    ? send<AdminBunVariant>(path, "POST", multipartForm(fields, images, "PATCH"))
    : send<AdminBunVariant>(path, "PATCH", fields);
}

export async function deleteBunVariant(bunVariantId: number): Promise<void> {
  await request(`/admin/bun-variants/${bunVariantId}`, "DELETE");
}
