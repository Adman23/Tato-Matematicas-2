export type ContrastLevel = "aa" | "aaa" | "fail" | "checking";

export interface AccessibilityReport {
  textOnPrimary: ContrastLevel;
  textOnBackground: ContrastLevel;
  textOnBubble: ContrastLevel;
  textOnBubbleSelected: ContrastLevel;
  bubbleOnBackground: ContrastLevel;
  selectedBubbleOnBackground: ContrastLevel;
}