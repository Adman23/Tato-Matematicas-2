// Calcula la luminosidad relativa
export function luminance(hex: string): number {
  const rgb = hex.replace("#", "").match(/.{1,2}/g);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Ratio de contraste según WCAG
export function contrastRatio(color1: string, color2: string): number {
  const L1 = luminance(color1);
  const L2 = luminance(color2);

  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

// Evalúa nivel WCAG AA/AAA
export function evaluateContrast(color1: string, color2: string): "aaa" | "aa" | "fail" {
  const ratio = contrastRatio(color1, color2);

  if (ratio >= 7) return "aaa";
  if (ratio >= 4.5) return "aa";
  return "fail";
}
