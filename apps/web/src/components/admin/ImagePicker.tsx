"use client";

import Image from "next/image";
import type { AdminImage } from "@/api/admin/types";
import { FieldError } from "./FieldError";
import type { LocalImage } from "./localImage";
import styles from "./admin.module.css";

const RECOMMENDED_WIDTH = 800;
const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/webp"];

type ImagePickerProps = {
  current: AdminImage | null;
  selected: LocalImage | null;
  errors: string[] | undefined;
  onSelect: (file: File) => void;
};

function imageWarnings(image: LocalImage): string[] {
  const warnings: string[] = [];
  if (!ACCEPTED_TYPES.includes(image.type)) warnings.push("O arquivo não é PNG nem WebP; a API vai recusá-lo.");
  if (image.bytes > MAX_BYTES) warnings.push("O arquivo passa de 2 MB; a API vai recusá-lo.");
  if (!image.hasTransparentEdges) warnings.push("As bordas não parecem transparentes: confira se a imagem tem fundo.");
  if (image.height > image.width) warnings.push("A imagem é mais alta do que larga; camadas costumam ser horizontais.");
  if (image.width < RECOMMENDED_WIDTH) {
    warnings.push(`Com ${image.width} px de largura, a imagem pode ficar sem nitidez em telas de alta resolução.`);
  }
  return warnings;
}

function formatKilobytes(bytes: number): string {
  return `${Math.round(bytes / 1024).toLocaleString("pt-BR")} KB`;
}

export function ImagePicker({ current, selected, errors, onSelect }: ImagePickerProps) {
  const shown = selected ?? current;
  const warnings = selected ? imageWarnings(selected) : [];

  return (
    <div className={styles.field}>
      <span className={styles.label} id="image-label">
        Imagem
      </span>
      {shown && (
        <div>
          <div className={styles.checkerboard}>
            <Image
              src={shown.url}
              alt="Prévia da imagem do ingrediente"
              width={shown.width}
              height={shown.height}
              unoptimized
            />
          </div>
          <p className={styles.imageFacts}>
            <span>
              {shown.width} × {shown.height} px
            </span>
            {selected && <span>{formatKilobytes(selected.bytes)}</span>}
            {selected ? <span>Nova imagem (ainda não salva)</span> : <span>Imagem atual</span>}
          </p>
        </div>
      )}
      <label className={styles.dropZone}>
        <input
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          aria-labelledby="image-label"
          aria-invalid={errors ? true : undefined}
          aria-describedby={errors ? "image-error" : undefined}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelect(file);
            event.target.value = "";
          }}
        />
        <strong>{shown ? "Trocar imagem" : "Escolher imagem"}</strong>
        <span>PNG ou WebP com fundo transparente, até 2 MB</span>
      </label>
      {warnings.map((warning) => (
        <p key={warning} className={styles.help}>
          ⚠ {warning}
        </p>
      ))}
      <FieldError id="image-error" messages={errors} />
    </div>
  );
}
