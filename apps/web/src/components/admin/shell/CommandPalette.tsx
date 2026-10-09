"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "../Icon";
import styles from "../admin.module.css";

export type SearchEntry = {
  id: string;
  group: string;
  title: string;
  meta: string;
  href: string;
  icon: IconName;
  image?: { url: string; width: number; height: number };
};

type CommandPaletteProps = {
  isOpen: boolean;
  entries: SearchEntry[];
  onClose: () => void;
};

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function CommandPalette({ isOpen, entries, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return entries.filter((entry) => {
      const haystack = normalize(`${entry.title} ${entry.group} ${entry.meta}`);
      return terms.every((term) => haystack.includes(term));
    });
  }, [entries, query]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function close() {
    setQuery("");
    setActiveIndex(0);
    onClose();
  }

  function open(entry: SearchEntry | undefined) {
    if (!entry) return;
    close();
    if (entry.href.startsWith("http") || entry.href === "/") window.open(entry.href, "_blank", "noopener");
    else router.push(entry.href);
  }

  function handleKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      open(results[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.paletteBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(event) => event.target === event.currentTarget && close()}
        >
          <motion.div
            className={styles.palette}
            role="dialog"
            aria-modal="true"
            aria-label="Buscar no admin"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 480, damping: 36 }}
          >
            <div className={styles.paletteInput}>
              <Icon name="search" />
              <input
                autoFocus
                value={query}
                placeholder="Buscar ingredientes, pães, presets ou ações…"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-results"
                aria-activedescendant={results[activeIndex] ? `palette-${results[activeIndex].id}` : undefined}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKey}
              />
              <span className={styles.kbd}>Esc</span>
            </div>
            {results.length === 0 ? (
              <p className={styles.paletteEmpty}>Nada encontrado para “{query}”.</p>
            ) : (
              <ul id="palette-results" ref={listRef} className={styles.paletteList} role="listbox">
                {results.map((entry, index) => {
                  const showsGroup = index === 0 || results[index - 1].group !== entry.group;
                  return (
                    <li key={entry.id} role="presentation">
                      {showsGroup && <div className={styles.paletteGroup}>{entry.group}</div>}
                      <div
                        id={`palette-${entry.id}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        className={styles.paletteItem}
                        onMouseMove={() => setActiveIndex(index)}
                        onClick={() => open(entry)}
                      >
                        {entry.image ? (
                          <span className={styles.rowMedia}>
                            <Image src={entry.image.url} alt="" width={entry.image.width} height={entry.image.height} unoptimized />
                          </span>
                        ) : (
                          <span className={styles.paletteIcon}>
                            <Icon name={entry.icon} />
                          </span>
                        )}
                        <span className={styles.rowText}>
                          <span className={styles.rowTitle}>{entry.title}</span>
                          <span className={styles.rowMeta}>{entry.meta}</span>
                        </span>
                        {index === activeIndex && <Icon name="chevronRight" />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className={styles.paletteFooter}>
              <span>↑↓ navegar</span>
              <span>↵ abrir</span>
              <span>Esc fechar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
