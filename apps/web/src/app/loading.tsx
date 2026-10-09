import { BuilderStatus } from "@/components/burger-builder/BuilderStatus";

export default function Loading() {
  return <BuilderStatus title="Carregando o montador…" message="Buscando ingredientes, pães e presets." isBusy />;
}
