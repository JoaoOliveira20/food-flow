import styles from "@/components/admin/admin.module.css";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando" role="status" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className={styles.skeleton} style={{ width: 120, height: 14 }} />
        <div className={styles.skeleton} style={{ width: 280, height: 30 }} />
        <div className={styles.skeleton} style={{ width: "min(520px, 100%)", height: 16 }} />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className={styles.skeleton} style={{ height: 220, borderRadius: 16 }} />
        ))}
      </div>
    </div>
  );
}
