import { Icon } from "./Icon";
import styles from "./admin.module.css";

type ImageTipsProps = {
  subject?: "ingredient" | "bun";
};

export function ImageTips({ subject = "ingredient" }: ImageTipsProps) {
  const isBun = subject === "bun";
  const item = isBun ? "pão" : "ingrediente";

  return (
    <details className={`${styles.panel} ${styles.tips}`}>
      <summary>
        Dicas para uma boa imagem
        <Icon name="chevronDown" />
      </summary>
      <ul>
        <li>Use PNG (ou WebP) com fundo transparente. Imagens com fundo não se encaixam na pilha.</li>
        <li>Fotografe o {item} de lado, levemente de cima, como os demais (estilo fotográfico).</li>
        <li>Recorte rente ao {item}: deixe só uma pequena margem transparente nas laterais.</li>
        {isBun ? (
          <li>Envie o topo e a base como imagens separadas, com proporções parecidas com as dos pães atuais.</li>
        ) : (
          <li>Prefira imagens mais largas do que altas — o ingrediente é visto como uma camada.</li>
        )}
        <li>Use pelo menos 800 px de largura para ficar nítido em telas de alta resolução (mínimo aceito: 280 px).</li>
        <li>Arquivo de até 2 MB.</li>
        <li>Mantenha iluminação e ângulo parecidos com os {isBun ? "pães" : "ingredientes"} existentes.</li>
      </ul>
    </details>
  );
}
