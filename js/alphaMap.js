// alphaMap.js
// Carga los mapas alfa de referencia desde assets/bg_48.png y bg_96.png.
// Estos archivos contienen la máscara de transparencia exacta de la marca de agua Gemini.

const ALPHA_MAP_URLS = {
  48: 'assets/bg_48.png',
  96: 'assets/bg_96.png'
};

// Cache para evitar recargas innecesarias
const cache = new Map();

/**
 * Obtiene el mapa alfa (ImageData) para el tamaño indicado.
 * @param {number} size - 48 o 96
 * @returns {Promise<ImageData>}
 */
export async function getAlphaMap(size) {
  if (cache.has(size)) {
    return cache.get(size);
  }

  const url = ALPHA_MAP_URLS[size];
  if (!url) {
    throw new Error(`Tamaño de mapa alfa no soportado: ${size}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url}: ${response.statusText}`);
  }

  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);

  cache.set(size, imageData);
  return imageData;
}