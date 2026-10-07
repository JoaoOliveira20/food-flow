"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { BrandMark, Icon, type IconName } from "../Icon";
import { CommandPalette, type SearchEntry } from "./CommandPalette";
import {
  prefersDarkTheme,
  readThemePreference,
  storeThemePreference,
  subscribeToSystemTheme,
  subscribeToThemePreference,
  type ThemePreference,
} from "./theme";
import { ToastProvider } from "./Toaster";
import styles from "../admin.module.css";

export type ShellCounts = {
  ingredients: number;
  bunVariants: number;
  presets: number;
};

type AdminShellProps = {
  fontClassName: string;
  counts: ShellCounts | null;
  searchEntries: SearchEntry[];
  children: ReactNode;
};

type NavLink = {
  href: string;
  label: string;
  icon: IconName;
  count?: number;
};

const THEMES: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: "light", label: "Tema claro", icon: "sun" },
  { value: "dark", label: "Tema escuro", icon: "moon" },
  { value: "system", label: "Tema do sistema", icon: "system" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function useThemePreference(): ThemePreference | null {
  return useSyncExternalStore(subscribeToThemePreference, readThemePreference, () => null);
}

function useResolvedTheme(preference: ThemePreference | null): "light" | "dark" | "auto" {
  const prefersDark = useSyncExternalStore(subscribeToSystemTheme, prefersDarkTheme, () => false);
  if (preference === null) return "auto";
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
}

export function AdminShell({ fontClassName, counts, searchEntries, children }: AdminShellProps) {
  const pathname = usePathname();
  const preference = useThemePreference();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const theme = useResolvedTheme(preference);


  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen((isOpen) => !isOpen);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function choosePreference(next: ThemePreference) {
    storeThemePreference(next);
  }

  const sections: { label: string; links: NavLink[] }[] = [
    { label: "Geral", links: [{ href: "/admin", label: "Visão geral", icon: "overview" }] },
    {
      label: "Catálogo",
      links: [
        { href: "/admin/ingredients", label: "Ingredientes", icon: "ingredient", count: counts?.ingredients },
        { href: "/admin/bun-variants", label: "Tipos de pão", icon: "bun", count: counts?.bunVariants },
        { href: "/admin/presets", label: "Presets", icon: "preset", count: counts?.presets },
      ],
    },
  ];

  const sidebar = (layoutGroup: string) => (
    <aside className={styles.sidebar}>
      <Link href="/admin" className={styles.brand}>
        <span className={styles.brandMark}>
          <BrandMark />
        </span>
        <span className={styles.brandName}>Food Flow</span>
        <span className={styles.brandTag}>Admin</span>
      </Link>

      <button type="button" className={styles.searchTrigger} onClick={() => setIsPaletteOpen(true)}>
        <Icon name="search" />
        Buscar…
        <span className={styles.kbd}>Ctrl K</span>
      </button>

      <nav aria-label="Admin" className={styles.nav}>
        {sections.map((section) => (
          <div key={section.label} className={styles.navSection}>
            <p className={styles.navLabel}>{section.label}</p>
            {section.links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.navItem}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setIsDrawerOpen(false)}
                >
                  {active && (
                    <motion.span
                      layoutId={`nav-active-${layoutGroup}`}
                      className={styles.navActive}
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon name={link.icon} />
                  <span>{link.label}</span>
                  {link.count !== undefined && <span className={styles.navCount}>{link.count}</span>}
                </Link>
              );
            })}
          </div>
        ))}
        <div className={styles.navSection}>
          <p className={styles.navLabel}>Montador</p>
          <a href="/" target="_blank" rel="noopener" className={styles.navItem}>
            <Icon name="external" />
            <span>Abrir montador</span>
          </a>
        </div>
      </nav>

      <div className={styles.sidebarFooter}>
        <p className={styles.demoNote}>
          <strong>Modo demonstração</strong>
          Sem login: qualquer alteração aparece para todos no montador.
        </p>
        <div className={styles.themeSwitch} role="group" aria-label="Tema">
          {THEMES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.label}
              title={option.label}
              aria-pressed={preference === option.value}
              onClick={() => choosePreference(option.value)}
            >
              <Icon name={option.icon} />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <div className={`${styles.shell} ${fontClassName}`} data-theme={theme}>
      <ToastProvider>
        <div className={styles.layout}>
          {sidebar("desktop")}
          <div className={styles.main}>
            <header className={styles.mobileBar}>
              <button type="button" className={styles.iconButton} onClick={() => setIsDrawerOpen(true)} aria-label="Abrir menu">
                <Icon name="menu" />
              </button>
              <Link href="/admin" className={styles.brand}>
                <span className={styles.brandMark}>
                  <BrandMark />
                </span>
                <span className={styles.brandName}>Food Flow</span>
              </Link>
              <button type="button" className={styles.iconButton} onClick={() => setIsPaletteOpen(true)} aria-label="Buscar">
                <Icon name="search" />
              </button>
            </header>
            <main className={styles.content}>{children}</main>
          </div>
        </div>

        <AnimatePresence>
          {isDrawerOpen && (
            <>
              <motion.div
                className={styles.drawerBackdrop}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
              />
              <motion.div
                className={styles.drawer}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 40 }}
                onKeyDown={(event) => event.key === "Escape" && setIsDrawerOpen(false)}
              >
                {sidebar("drawer")}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <CommandPalette isOpen={isPaletteOpen} entries={searchEntries} onClose={() => setIsPaletteOpen(false)} />
      </ToastProvider>
    </div>
  );
}
