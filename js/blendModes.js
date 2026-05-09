// blendModes.js
// Implementa el Reverse Alpha Blending exacto.

/**
 * Elimina la marca de agua de los datos de píxeles de la imagen original.
 * @param {ImageData} srcImageData - Datos de la imagen cargada
 * @param {ImageData} watermarkImageData - Mapa alfa de la marca (ya posicionado)
 * @param {number} baseAlpha - Factor de opacidad (debe ser 1.0 si el mapa alfa ya contiene la opacidad real)
 */
export function removeWatermark(srcImageData, watermarkImageData, baseAlpha = 1.0) {
  const src = srcImageData.data;
  const wm = watermarkImageData.data;

  for (let i = 0; i < src.length; i += 4) {
    const wmAlpha = wm[i + 3] / 255; // opacidad del mapa alfa (0..1)
    if (wmAlpha > 0) {
      const effectiveAlpha = baseAlpha * wmAlpha; // factor de mezcla real
      const invAlpha = 1 - effectiveAlpha;
      if (invAlpha > 0) {
        // Asumimos Pixel_logo = 255 (blanco)
        src[i]     = clamp((src[i]     - effectiveAlpha * 255) / invAlpha);
        src[i + 1] = clamp((src[i + 1] - effectiveAlpha * 255) / invAlpha);
        src[i + 2] = clamp((src[i + 2] - effectiveAlpha * 255) / invAlpha);
      }
    }
  }
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}