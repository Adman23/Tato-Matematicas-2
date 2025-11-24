import { evaluateContrast } from "./contrast";

export type PaletteAnalysis = "aaa" | "aa" | "fail";

export function analyzePalette(palette: {
  primary: string;
  text_on_primary: string;
  background: string;
  text_on_bg: string;
}): PaletteAnalysis {
  
  const results = [
    evaluateContrast(palette.primary, palette.text_on_primary),
    evaluateContrast(palette.background, palette.text_on_bg),
  ];

  // Si cualquiera falla → falla todo
  if (results.includes("fail")) return "fail";

  // Si al menos un par solo llega a AA → AA
  if (results.includes("aa")) return "aa";

  // Si todos son AAA → AAA
  return "aaa";
}
