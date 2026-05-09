// engine.js
import { getAlphaMap } from './alphaMap.js';
import { removeWatermark } from './blendModes.js';

export async function processImage(file) {
  const img = await createImageBitmap(file);
  const width = img.width;
  const height = img.height;

  const minDim = Math.min(width, height);
  const refSize = minDim <= 1024 ? 48 : 96;
  const margin = refSize === 48 ? 32 : 64;

  const alphaMapNative = await getAlphaMap(refSize);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const wmCanvas = document.createElement('canvas');
  wmCanvas.width = width;
  wmCanvas.height = height;
  const wmCtx = wmCanvas.getContext('2d');
  wmCtx.clearRect(0, 0, width, height);

  // Colocar la marca en la esquina inferior derecha (sin rectángulo rojo)
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = refSize;
  tempCanvas.height = refSize;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(alphaMapNative, 0, 0);

  const x = width - refSize - margin;
  const y = height - refSize - margin;
  wmCtx.drawImage(tempCanvas, x, y);

  const srcImageData = ctx.getImageData(0, 0, width, height);
  const watermarkImageData = wmCtx.getImageData(0, 0, width, height);

  // baseAlpha = 1.0 porque la opacidad real ya viene en el mapa
  removeWatermark(srcImageData, watermarkImageData, 1.0);

  ctx.putImageData(srcImageData, 0, 0);

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      if (!blob) throw new Error('No se pudo generar la imagen');
      resolve(blob);
    }, 'image/png');
  });
}