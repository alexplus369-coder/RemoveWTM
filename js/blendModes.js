// blendModes.js
// Implementa el Reverse Alpha Blending exacto.

export function removeWatermark(srcImageData, watermarkImageData, baseAlpha = 1.0) {
  const src = srcImageData.data;
  const wm = watermarkImageData.data;

  for (let i = 0; i < src.length; i += 4) {
    // los PNG de calibración son escala de grises: R=G=B=opacidad (0-255)
    const wmAlpha = wm[i] / 255; // canal rojo, ya que son grises
    if (wmAlpha > 0) {
      const effectiveAlpha = baseAlpha * wmAlpha;
      const invAlpha = 1 - effectiveAlpha;
      if (invAlpha > 0) {
        // Pixel_logo = blanco (255,255,255)
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