// engine.js
import { getAlphaMap } from './alphaMap.js';
import { removeWatermark } from './blendModes.js';

/**
 * Procesa un archivo de imagen y devuelve un blob PNG sin la marca de agua.
 * @param {File} file - Archivo de imagen del usuario
 * @param {number} baseAlpha - Opacidad global de la marca (0.25 típico)
 * @param {string} tileMode - 'repeat', 'center' o 'br'
 * @returns {Promise<Blob>}
 */
export async function processImage(file, baseAlpha, tileMode) {
  // Cargar la imagen del usuario
  const imageBitmap = await createImageBitmap(file);
  const width = imageBitmap.width;
  const height = imageBitmap.height;

  // Seleccionar el tamaño del mapa alfa (48 si la imagen es <= 1024px en su lado más corto, según referencia)
  const refSize = Math.min(width, height) <= 1024 ? 48 : 96;

  // Obtener el mapa alfa nativo (caché en producción si se desea)
  const alphaMapNative = await getAlphaMap(refSize);

  // Crear canvas para la imagen final
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dibujar la imagen original
  ctx.drawImage(imageBitmap, 0, 0);

  // Construir el mapa de marca de agua escalado al tamaño de la imagen
  const watermarkCanvas = document.createElement('canvas');
  watermarkCanvas.width = width;
  watermarkCanvas.height = height;
  const wmCtx = watermarkCanvas.getContext('2d');
  wmCtx.clearRect(0, 0, width, height);

  if (tileMode === 'repeat') {
    // Rellenar con patrón repetitivo
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = refSize;
    patternCanvas.height = refSize;
    const patCtx = patternCanvas.getContext('2d');
    patCtx.putImageData(alphaMapNative, 0, 0);
    const pattern = wmCtx.createPattern(patternCanvas, 'repeat');
    wmCtx.fillStyle = pattern;
    wmCtx.fillRect(0, 0, width, height);
  } else if (tileMode === 'center') {
    const s = Math.min(width, height) * 0.3;
    const x = (width - s) / 2;
    const y = (height - s) / 2;
    wmCtx.imageSmoothingEnabled = false;
    wmCtx.drawImage(await createImageBitmap(alphaMapNative), x, y, s, s);
  } else if (tileMode === 'br') {
    const s = Math.min(width, height) * 0.15;
    const x = width - s - 10;
    const y = height - s - 10;
    wmCtx.imageSmoothingEnabled = false;
    wmCtx.drawImage(await createImageBitmap(alphaMapNative), x, y, s, s);
  }

  const watermarkImageData = wmCtx.getImageData(0, 0, width, height);
  const srcImageData = ctx.getImageData(0, 0, width, height);

  // Aplicar algoritmo
  removeWatermark(srcImageData, watermarkImageData, baseAlpha);

  ctx.putImageData(srcImageData, 0, 0);

  // Devolver como blob PNG
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}