export type ContrastLevel = "aa" | "aaa" | "fail" | "checking";

export interface AccessibilityReport {
  textOnPrimary: ContrastLevel;
  textOnBackground: ContrastLevel;
  PrimaryOnBackgroud: ContrastLevel;
  buttonOnPrimary: ContrastLevel;
  textOnBubble: ContrastLevel;
  textOnBubbleSelected: ContrastLevel;
  bubbleOnBackground: ContrastLevel;
  selectedBubbleOnBackground: ContrastLevel;
}