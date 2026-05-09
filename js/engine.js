// engine.js
// Controlador principal de procesamiento de imágenes.

import { getAlphaMap } from './alphaMap.js';
import { removeWatermark } from './blendModes.js';

/**
 * Procesa una imagen y devuelve un blob PNG sin la marca de agua.
 * @param {File} file - Archivo de imagen del usuario
 * @returns {Promise<Blob>}
 */
export async function processImage(file) {
  // 1. Cargar imagen del usuario
  const img = await createImageBitmap(file);
  const width = img.width;
  const height = img.height;

  // 2. Determinar tamaño del mapa alfa y margen según dimensiones
  const minDim = Math.min(width, height);
  const refSize = minDim <= 1024 ? 48 : 96;
  const margin = refSize === 48 ? 32 : 64;

  // 3. Obtener el mapa alfa nativo (ImageData)
  const alphaMapNative = await getAlphaMap(refSize);

  // 4. Crear canvas de trabajo y dibujar la imagen original
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // 5. Crear canvas para la máscara de marca de agua (mismo tamaño)
  const wmCanvas = document.createElement('canvas');
  wmCanvas.width = width;
  wmCanvas.height = height;
  const wmCtx = wmCanvas.getContext('2d');
  wmCtx.clearRect(0, 0, width, height);

  // 6. Posicionar la marca en la esquina inferior derecha (sin escalar)
  // Creamos un canvas temporal con el ImageData del mapa alfa
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = refSize;
  tempCanvas.height = refSize;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(alphaMapNative, 0, 0);

  const x = width - refSize - margin;
  const y = height - refSize - margin;
  wmCtx.drawImage(tempCanvas, x, y);

  // 7. Obtener ImageData de ambas capas
  const srcImageData = ctx.getImageData(0, 0, width, height);
  const watermarkImageData = wmCtx.getImageData(0, 0, width, height);

  // 8. Aplicar algoritmo (opacidad base 1.0, el mapa alfa ya contiene transparencia)
  removeWatermark(srcImageData, watermarkImageData, 1.0);

  // 9. Volcar resultado y exportar como blob PNG
  ctx.putImageData(srcImageData, 0, 0);
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}
