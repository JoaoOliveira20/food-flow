import Link from "next/link";
import { AdminStatus } from "@/components/admin/AdminStatus";
import styles from "@/components/admin/admin.module.css";

export default function NotFound() {
  return (
    <AdminStatus title="Item não encontrado" message="O ingrediente ou preset que você procura não existe ou foi excluído.">
      <Link href="/admin" className={styles.buttonPrimary}>
        Voltar ao painel
      </Link>
    </AdminStatus>
  );
}
