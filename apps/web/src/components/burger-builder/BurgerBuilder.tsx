"use client";

import { useReducer, type ReactNode } from "react";
import { findIngredient, type BuilderCatalog, type CompositionPreset } from "@/burger/catalog";
import {
  compositionReducer,
  createInitialComposition,
  createInstanceId,
  createRecipeInstanceIds,
  hasChangedSinceAppliedRecipe,
  hasReachedLayerLimit,
  matchesRecipe,
  type Composition,
  type CompositionRecipe,
} from "@/burger/composition";
import { BuilderHeader } from "./BuilderHeader";
import { BunPicker } from "./BunPicker";
import { BurgerWorkbench } from "./BurgerWorkbench";
import { IngredientPanel } from "./IngredientPanel";
import { PresetPicker } from "./PresetPicker";
import { useBurgerWorkbench } from "./useBurgerWorkbench";
import styles from "./burgerBuilder.module.css";

type BuilderStart = {
  catalog: BuilderCatalog;
  recipe: CompositionRecipe;
};

function initialCompositionOf({ catalog, recipe }: BuilderStart): Composition {
  return createInitialComposition(recipe, catalog.maxLayers);
}

function recipeOf(composition: Composition): CompositionRecipe {
  return {
    bunVariantId: composition.bunVariantId,
    ingredientIds: composition.layers.map((layer) => layer.ingredientId),
  };
}

export type BuilderHeaderControls = {
  recipe: CompositionRecipe;
  reset: () => void;
};

type BurgerBuilderProps = {
  catalog: BuilderCatalog;
  initialRecipe?: CompositionRecipe;
  isEmbedded?: boolean;
  presetsTitle?: string;
  renderHeader?: (controls: BuilderHeaderControls) => ReactNode;
};

export function BurgerBuilder({
  catalog,
  initialRecipe = catalog.initialRecipe,
  isEmbedded = false,
  presetsTitle,
  renderHeader,
}: BurgerBuilderProps) {
  const [composition, dispatch] = useReducer(compositionReducer, { catalog, recipe: initialRecipe }, initialCompositionOf);
  const workbench = useBurgerWorkbench({ catalog, composition, dispatch });
  const isFull = hasReachedLayerLimit(composition);
  const selectedLayer = composition.layers.find((layer) => layer.instanceId === composition.selectedInstanceId);
  const selectedIngredient = selectedLayer ? findIngredient(catalog, selectedLayer.ingredientId) : null;
  const currentPresetId = catalog.presets.find((preset) => matchesRecipe(composition, preset))?.id ?? null;

  function pickIngredient(ingredientId: string) {
    if (composition.isReplacingSelection) {
      dispatch({ type: "replaceSelectedLayer", ingredientId, instanceId: createInstanceId() });
    } else {
      dispatch({ type: "addIngredient", ingredientId, instanceId: createInstanceId() });
    }
  }

  function applyRecipe(recipe: CompositionRecipe) {
    dispatch({ type: "applyRecipe", recipe, instanceIds: createRecipeInstanceIds(recipe) });
  }

  function applyPreset(preset: CompositionPreset) {
    applyRecipe(preset);
    workbench.showMessage(`✓ Preset ${preset.name} aplicado.`);
  }

  return (
    <div className={`${styles.page} ${isEmbedded ? styles.pageEmbedded : ""}`}>
      {renderHeader ? (
        renderHeader({ recipe: recipeOf(composition), reset: () => applyRecipe(initialRecipe) })
      ) : (
        <BuilderHeader onReset={() => applyRecipe(initialRecipe)} />
      )}

      <main className={styles.main}>
        <IngredientPanel
          ingredients={catalog.ingredients}
          replacedIngredientName={composition.isReplacingSelection ? (selectedIngredient?.name ?? null) : null}
          isDisabled={!composition.isReplacingSelection && isFull}
          onPickIngredient={pickIngredient}
          onIngredientPointerDown={workbench.startIngredientDrag}
        />

        <BurgerWorkbench workbench={workbench} catalog={catalog} composition={composition} dispatch={dispatch} />

        <BunPicker
          bunVariants={catalog.bunVariants}
          selectedBunVariantId={composition.bunVariantId}
          onSelectBunVariant={(bunVariantId) => dispatch({ type: "selectBunVariant", bunVariantId })}
        />

        <PresetPicker
          title={presetsTitle}
          catalog={catalog}
          currentPresetId={currentPresetId}
          requiresConfirmation={hasChangedSinceAppliedRecipe(composition)}
          onApplyPreset={applyPreset}
        />
      </main>

    </div>
  );
}
