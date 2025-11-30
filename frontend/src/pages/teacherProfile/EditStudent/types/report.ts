export type ContrastLevel = "aa" | "aaa" | "fail" | "checking";

export interface AccessibilityReport {
  textOnPrimary: ContrastLevel;
  textOnBackground: ContrastLevel;
  primaryOnBackground: ContrastLevel;
  bubbleOnBackground: ContrastLevel;
  selectedBubbleOnBackground: ContrastLevel;
}