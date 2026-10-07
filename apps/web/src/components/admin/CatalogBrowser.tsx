"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import styles from "./admin.module.css";

export type CatalogItem = {
  key: string;
  href: string;
  title: string;
  meta: string;
  filter: string;
  badge: ReactNode;
  media: ReactNode;
};

type CatalogBrowserProps = {
  items: CatalogItem[];
  filters: { value: string; label: string }[];
  searchLabel: string;
  emptyIcon: IconName;
  emptyTitle: string;
  emptyText: string;
  emptyAction: ReactNode;
};

const ALL = "all";

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function CatalogBrowser({
  items,
  filters,
  searchLabel,
  emptyIcon,
  emptyTitle,
  emptyText,
  emptyAction,
}: CatalogBrowserProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(ALL);

  const visibleItems = useMemo(() => {
    const term = normalize(query.trim());
    return items.filter(
      (item) => (filter === ALL || item.filter === filter) && (!term || normalize(`${item.title} ${item.meta}`).includes(term)),
    );
  }, [items, query, filter]);

  if (items.length === 0) {
    return (
      <div className={`${styles.panel} ${styles.empty}`}>
        <span className={styles.emptyIcon}>
          <Icon name={emptyIcon} />
        </span>
        <p className={styles.emptyTitle}>{emptyTitle}</p>
        <p className={styles.help}>{emptyText}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Icon name="search" />
          <input
            className={styles.input}
            type="search"
            value={query}
            placeholder={searchLabel}
            aria-label={searchLabel}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className={styles.segmented} role="group" aria-label="Filtrar">
          {[{ value: ALL, label: "Todos" }, ...filters].map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className={styles.resultCount} aria-live="polite">
          {visibleItems.length === 1 ? "1 item" : `${visibleItems.length} itens`}
        </span>
      </div>

      {visibleItems.length === 0 ? (
        <div className={`${styles.panel} ${styles.empty}`}>
          <span className={styles.emptyIcon}>
            <Icon name="search" />
          </span>
          <p className={styles.emptyTitle}>Nenhum resultado</p>
          <p className={styles.help}>Tente outro nome ou limpe os filtros.</p>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              setQuery("");
              setFilter(ALL);
            }}
          >
            Limpar busca e filtros
          </button>
        </div>
      ) : (
        <ul className={styles.grid} role="list">
          {visibleItems.map((item) => (
            <li key={item.key}>
              <Link href={item.href} className={`${styles.panel} ${styles.tile}`}>
                <span className={styles.tileMedia}>
                  <span className={styles.tileBadge}>{item.badge}</span>
                  {item.media}
                </span>
                <span className={styles.tileBody}>
                  <span className={styles.tileTitle}>{item.title}</span>
                  <span className={styles.tileMeta}>{item.meta}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
