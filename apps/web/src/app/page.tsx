import { BURGER_CATALOG } from "@/burger/burgerCatalog";
import { BurgerBuilder } from "@/components/burger-builder/BurgerBuilder";

export default function Home() {
  return <BurgerBuilder catalog={BURGER_CATALOG} />;
}
