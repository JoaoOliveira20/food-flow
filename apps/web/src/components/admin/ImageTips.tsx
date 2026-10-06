import styles from "./admin.module.css";

export function ImageTips() {
  return (
    <section className={styles.card} aria-labelledby="image-tips-title">
      <h2 id="image-tips-title" className={styles.cardTitle}>
        Dicas para uma boa imagem
      </h2>
      <ul className={styles.tips}>
        <li>Use PNG (ou WebP) com fundo transparente. Imagens com fundo não se encaixam na pilha.</li>
        <li>Fotografe o ingrediente de lado, levemente de cima, como os demais (estilo fotográfico).</li>
        <li>Recorte rente ao ingrediente: deixe só uma pequena margem transparente nas laterais.</li>
        <li>Prefira imagens mais largas do que altas — o ingrediente é visto como uma camada.</li>
        <li>Use pelo menos 800 px de largura para ficar nítido em telas de alta resolução (mínimo aceito: 280 px).</li>
        <li>Arquivo de até 2 MB.</li>
        <li>Mantenha iluminação e ângulo parecidos com os ingredientes existentes.</li>
        <li>Confira no preview: tamanho, encaixe com as camadas vizinhas e bordas do recorte.</li>
      </ul>
    </section>
  );
}
