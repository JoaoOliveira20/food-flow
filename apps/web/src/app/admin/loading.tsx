import { AdminStatus } from "@/components/admin/AdminStatus";

export default function Loading() {
  return <AdminStatus title="Carregando…" message="Buscando os dados do montador." isBusy />;
}
