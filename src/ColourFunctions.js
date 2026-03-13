export function hexToRbga (hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function setHslaAlpha(hslaColor, newAlpha) {
  const match = hslaColor.match(
    /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/
  );

  if (!match) {
    console.warn("Invalid HSLA color:", hslaColor);
    return hslaColor;
  }

  const [, h, s, l] = match;  
  return `hsla(${h}, ${s}%, ${l}%, ${newAlpha})`;
}

export function generateRandomColour(alpha = 1) {
  const h = Math.floor(Math.random() * 360);     // pełne spektrum
  const s = 80 + Math.random() * 20;             // 80–100% saturation
  const l = 45 + Math.random() * 15;             // 45–60% lightness

  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}