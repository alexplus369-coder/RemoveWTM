// blendModes.js
// Implementa el Reverse Alpha Blending.

/**
 * Aplica la eliminación de marca de agua a los datos de imagen.
 * @param {ImageData} srcImageData - Imagen cargada por el usuario
 * @param {ImageData} watermarkImageData - Mapa alfa de la marca (escalado al tamaño de la imagen)
 * @param {number} baseAlpha - Opacidad base de la marca (0.0 - 1.0)
 */
export function removeWatermark(srcImageData, watermarkImageData, baseAlpha) {
  const srcPixels = srcImageData.data;
  const wmPixels = watermarkImageData.data;

  for (let i = 0; i < srcPixels.length; i += 4) {
    const wmAlpha = wmPixels[i + 3] / 255; // el PNG original tiene valores alfa
    if (wmAlpha > 0) {
      const effectiveAlpha = baseAlpha * wmAlpha;
      const invAlpha = 1 - effectiveAlpha;
      if (invAlpha > 0) {
        srcPixels[i]     = clamp((srcPixels[i]     - effectiveAlpha * 255) / invAlpha);
        srcPixels[i + 1] = clamp((srcPixels[i + 1] - effectiveAlpha * 255) / invAlpha);
        srcPixels[i + 2] = clamp((srcPixels[i + 2] - effectiveAlpha * 255) / invAlpha);
      }
    }
  }
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}