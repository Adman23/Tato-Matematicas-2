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

export function analyzePaletteDetailed(palette: {
  primary: string;
  text_on_primary: string;
  background: string;
  text_on_bg: string;
  bubble: string;
  bubble_selected: string;
  feedback_correct: string;
  feedback_incorrect: string;
}) {
  return {
    textOnPrimary: evaluateContrast(palette.text_on_primary, palette.primary),
    textOnBackground: evaluateContrast(palette.text_on_bg, palette.background),
    primaryOnBackground: evaluateContrast(palette.primary, palette.background),
    bubbleOnBackground: evaluateContrast(palette.bubble, palette.background),
    bubbleSelectedOnBackground: evaluateContrast(palette.bubble_selected, palette.background),
    feedbackCorrectOnBackground: evaluateContrast(palette.feedback_correct, palette.background),
    feedbackIncorrectOnBackground: evaluateContrast(palette.feedback_incorrect, palette.background),
  };
}

