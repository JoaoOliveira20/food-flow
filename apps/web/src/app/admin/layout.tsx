import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getAdminBuilder, listBunVariants, listIngredients, listPresets } from "@/api/admin/queries";
import { AdminShell, type ShellCounts } from "@/components/admin/shell/AdminShell";
import type { SearchEntry } from "@/components/admin/shell/CommandPalette";
import { SIDEBAR_BOOT_SCRIPT } from "@/components/admin/shell/sidebar";
import { THEME_BOOT_SCRIPT } from "@/components/admin/shell/theme";
import { PRESET_STATUS_LABELS, presetStatus } from "@/components/admin/presetStatus";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Admin · Food Flow", template: "%s · Admin · Food Flow" },
  robots: { index: false, follow: false },
};

const NAVIGATION_ENTRIES: SearchEntry[] = [
  { id: "page-overview", group: "Páginas", title: "Visão geral", meta: "Resumo do montador", href: "/admin", icon: "overview" },
  { id: "page-ingredients", group: "Páginas", title: "Ingredientes", meta: "Catálogo", href: "/admin/ingredients", icon: "ingredient" },
  { id: "page-buns", group: "Páginas", title: "Tipos de pão", meta: "Catálogo", href: "/admin/bun-variants", icon: "bun" },
  { id: "page-presets", group: "Páginas", title: "Presets", meta: "Catálogo", href: "/admin/presets", icon: "preset" },
  { id: "page-builder", group: "Páginas", title: "Abrir montador", meta: "Nova aba", href: "/", icon: "external" },
  { id: "new-ingredient", group: "Ações", title: "Novo ingrediente", meta: "Criar", href: "/admin/ingredients/new", icon: "plus" },
  { id: "new-bun", group: "Ações", title: "Novo tipo de pão", meta: "Criar", href: "/admin/bun-variants/new", icon: "plus" },
  { id: "new-preset", group: "Ações", title: "Novo preset", meta: "Criar", href: "/admin/presets/new", icon: "plus" },
];

async function loadShellData(): Promise<{ counts: ShellCounts | null; entries: SearchEntry[] }> {
  try {
    const builder = await getAdminBuilder();
    if (!builder) return { counts: null, entries: NAVIGATION_ENTRIES };
    const [ingredients, bunVariants, presets] = await Promise.all([
      listIngredients(builder.id),
      listBunVariants(builder.id),
      listPresets(builder.id),
    ]);
    const status = (isVisible: boolean) => (isVisible ? "Publicado" : "Oculto");
    return {
      counts: { ingredients: ingredients.length, bunVariants: bunVariants.length, presets: presets.length },
      entries: [
        ...NAVIGATION_ENTRIES,
        ...ingredients.map((item): SearchEntry => ({
          id: `ingredient-${item.id}`,
          group: "Ingredientes",
          title: item.name,
          meta: status(item.isVisible),
          href: `/admin/ingredients/${item.id}`,
          icon: "ingredient",
          image: item.image,
        })),
        ...bunVariants.map((item): SearchEntry => ({
          id: `bun-${item.id}`,
          group: "Tipos de pão",
          title: item.name,
          meta: status(item.isVisible),
          href: `/admin/bun-variants/${item.id}`,
          icon: "bun",
          image: item.topImage,
        })),
        ...presets.map((item): SearchEntry => ({
          id: `preset-${item.id}`,
          group: "Presets",
          title: item.name,
          meta: PRESET_STATUS_LABELS[presetStatus(item)],
          href: `/admin/presets/${item.id}`,
          icon: "preset",
        })),
      ],
    };
  } catch {
    return { counts: null, entries: NAVIGATION_ENTRIES };
  }
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { counts, entries } = await loadShellData();

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `${THEME_BOOT_SCRIPT};${SIDEBAR_BOOT_SCRIPT}` }} />
      <AdminShell fontClassName={`${geist.variable} ${geistMono.variable}`} counts={counts} searchEntries={entries}>
        {children}
      </AdminShell>
    </>
  );
}
