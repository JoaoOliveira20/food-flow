"use client";

import Image from "next/image";
import { useState, type DragEvent } from "react";
import type { AdminImage } from "@/api/admin/types";
import { FieldError } from "./FieldError";
import { Icon } from "./Icon";
import type { LocalImage } from "./localImage";
import styles from "./admin.module.css";

const RECOMMENDED_WIDTH = 800;
const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/webp"];

type ImagePickerProps = {
  id?: string;
  label?: string;
  current: AdminImage | null;
  selected: LocalImage | null;
  errors: string[] | undefined;
  extraWarnings?: string[];
  onSelect: (file: File) => void;
};

function imageWarnings(image: LocalImage): string[] {
  const warnings: string[] = [];
  if (!ACCEPTED_TYPES.includes(image.type)) warnings.push("O arquivo não é PNG nem WebP; a API vai recusá-lo.");
  if (image.bytes > MAX_BYTES) warnings.push("O arquivo passa de 2 MB; a API vai recusá-lo.");
  if (!image.hasTransparentEdges) warnings.push("As bordas não parecem transparentes: confira se a imagem tem fundo.");
  if (image.height > image.width) warnings.push("A imagem é mais alta do que larga; camadas costumam ser horizontais.");
  if (image.width < RECOMMENDED_WIDTH) {
    warnings.push(`Com ${image.width} px de largura, pode ficar sem nitidez em telas de alta resolução.`);
  }
  return warnings;
}

function formatKilobytes(bytes: number): string {
  return `${Math.round(bytes / 1024).toLocaleString("pt-BR")} KB`;
}

export function ImagePicker({
  id = "image",
  label = "Imagem",
  current,
  selected,
  errors,
  extraWarnings = [],
  onSelect,
}: ImagePickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const shown = selected ?? current;
  const warnings = [...(selected ? imageWarnings(selected) : []), ...extraWarnings];

  function drop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onSelect(file);
  }

  return (
    <div className={styles.picker}>
      <label
        className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={drop}
      >
        <input
          id={id}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          aria-label={label}
          aria-invalid={errors ? true : undefined}
          aria-describedby={errors ? `${id}-error` : undefined}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelect(file);
            event.target.value = "";
          }}
        />
        {shown ? (
          <>
            <Image src={shown.url} alt={`Prévia: ${label.toLowerCase()}`} width={shown.width} height={shown.height} unoptimized />
            <span className={styles.dropOverlay}>{isDragging ? "Solte para trocar" : "Trocar imagem"}</span>
          </>
        ) : (
          <span className={styles.dropHint}>
            <Icon name="upload" />
            <strong>{isDragging ? "Solte a imagem aqui" : "Arraste uma imagem ou clique"}</strong>
            PNG ou WebP com fundo transparente, até 2 MB
          </span>
        )}
      </label>
      {shown && (
        <p className={styles.imageFacts}>
          <span>
            {shown.width} × {shown.height} px
          </span>
          {selected && <span>{formatKilobytes(selected.bytes)}</span>}
          <span>{selected ? "Nova imagem · ainda não salva" : "Imagem atual"}</span>
        </p>
      )}
      {warnings.map((warning) => (
        <p key={warning} className={styles.warning}>
          <Icon name="alert" />
          {warning}
        </p>
      ))}
      <FieldError id={`${id}-error`} messages={errors} />
    </div>
  );
}
