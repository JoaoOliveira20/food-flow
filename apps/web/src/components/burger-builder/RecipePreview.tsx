import { createCompositionFromRecipe, type CompositionRecipe } from "@/burger/composition";
import { computeStackLayout, STACK_BASE_WIDTH } from "@/burger/stackLayout";

type RecipePreviewProps = {
  recipe: CompositionRecipe;
  className: string;
};

export function RecipePreview({ recipe, className }: RecipePreviewProps) {
  const previewKeys = recipe.ingredientIds.map((_, index) => `preview-${index}`);
  const layout = computeStackLayout(createCompositionFromRecipe(recipe, previewKeys));
  const viewBox = `${-STACK_BASE_WIDTH / 2} ${-layout.height} ${STACK_BASE_WIDTH} ${layout.height}`;

  return (
    <svg className={className} viewBox={viewBox} aria-hidden="true">
      {layout.layers.map((layer) => (
        <image
          key={layer.key}
          href={layer.imagePath}
          x={-layer.width / 2}
          y={-(layer.bottom + layer.height)}
          width={layer.width}
          height={layer.height}
        />
      ))}
    </svg>
  );
}
