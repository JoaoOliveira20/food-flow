export type LocalImage = {
  url: string;
  width: number;
  height: number;
  bytes: number;
  type: string;
  hasTransparentEdges: boolean;
};

const EDGE_SAMPLE_SIZE = 64;
const TRANSPARENT_ALPHA = 250;

function edgesHaveTransparency(image: HTMLImageElement): boolean {
  const canvas = document.createElement("canvas");
  canvas.width = EDGE_SAMPLE_SIZE;
  canvas.height = EDGE_SAMPLE_SIZE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return true;
  context.drawImage(image, 0, 0, EDGE_SAMPLE_SIZE, EDGE_SAMPLE_SIZE);
  const { data } = context.getImageData(0, 0, EDGE_SAMPLE_SIZE, EDGE_SAMPLE_SIZE);
  const last = EDGE_SAMPLE_SIZE - 1;
  for (let index = 0; index < EDGE_SAMPLE_SIZE; index += 1) {
    const edgePixels = [
      [index, 0],
      [index, last],
      [0, index],
      [last, index],
    ];
    const isTransparent = edgePixels.some(([x, y]) => data[(y * EDGE_SAMPLE_SIZE + x) * 4 + 3] < TRANSPARENT_ALPHA);
    if (isTransparent) return true;
  }
  return false;
}

export function readLocalImage(file: File): Promise<LocalImage> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        bytes: file.size,
        type: file.type,
        hasTransparentEdges: edgesHaveTransparency(image),
      });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The file is not a readable image."));
    };
    image.src = url;
  });
}
