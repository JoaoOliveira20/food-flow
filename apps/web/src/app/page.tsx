import { notFound } from "next/navigation";
import { connection } from "next/server";
import { fetchBuilderCatalog } from "@/api/builderCatalog";
import { BuilderStatus } from "@/components/burger-builder/BuilderStatus";
import { BurgerBuilder } from "@/components/burger-builder/BurgerBuilder";

export default async function Home() {
  await connection();
  const result = await fetchBuilderCatalog("burger");

  if (result.status === "notFound") notFound();
  if (result.status === "unavailable") {
    return (
      <BuilderStatus
        title="Montador indisponível"
        message="Ainda não há tipos de pão cadastrados para montar um hambúrguer. Volte em instantes."
      />
    );
  }

  return <BurgerBuilder catalog={result.catalog} />;
}
