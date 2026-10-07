export type AdminImage = {
  url: string;
  width: number;
  height: number;
};

export type AdminShape = {
  displayWidth: number;
  restingSurfaceRatio: number;
  sinkRatio: number;
};

export type AdminBuilder = {
  id: number;
  slug: string;
  name: string;
  maxLayers: number;
  initialPresetId: number | null;
  ingredientsCount: number;
  visibleIngredientsCount: number;
  presetsCount: number;
  bunVariantsCount: number;
  visibleBunVariantsCount: number;
};

export type AdminPresetReference = {
  id: number;
  name: string;
};

export type AdminIngredient = {
  id: number;
  builderId: number;
  slug: string;
  name: string;
  image: AdminImage;
  shape: AdminShape;
  isVisible: boolean;
  sortOrder: number;
  presetsCount?: number;
  presets?: AdminPresetReference[];
  createdAt: string;
  updatedAt: string;
};

export type AdminPreset = {
  id: number;
  builderId: number;
  name: string;
  bunVariantId: number;
  ingredientIds: number[];
  sortOrder: number;
  isInitial: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminBunVariant = {
  id: number;
  builderId: number;
  slug: string;
  name: string;
  topImage: AdminImage;
  bottomImage: AdminImage;
  isVisible: boolean;
  sortOrder: number;
  presetsCount?: number;
  presets?: AdminPresetReference[];
  createdAt: string;
  updatedAt: string;
};
