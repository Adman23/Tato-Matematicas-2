import type { AccessibilityReport } from "../types/report";
import AccessibilityIndicator from "./AccesibilityIndicator";

export interface AccessibilityDashboardProps {
  report: AccessibilityReport; // ahora acepta "checking"
}

export const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({ report }) => {
  return (
    <div className="accessibility-dashboard">
      <div>
        <span>Texto sobre color principal: </span>
        <AccessibilityIndicator status={report.textOnPrimary} />
      </div>
      <div>
        <span>Texto sobre fondo: </span>
        <AccessibilityIndicator status={report.textOnBackground} />
      </div>
      <div>
        <span>Color principal sobre fondo: </span>
        <AccessibilityIndicator status={report.PrimaryOnBackgroud} />
      </div>
      <div>
        <span>Color del botón sobre el color principal: </span>
        <AccessibilityIndicator status={report.buttonOnPrimary} />
      </div>
      <div>
        <span>Texto sobre burbujas: </span>
        <AccessibilityIndicator status={report.textOnBubble} />
      </div>
      <div>
        <span>Texto sobre burbujas seleccionadas: </span>
        <AccessibilityIndicator status={report.textOnBubbleSelected} />
      </div>

      <div>
        <span>Burbujas sobre fondo: </span>
        <AccessibilityIndicator status={report.bubbleOnBackground} />
      </div>
      <div>
        <span>Burbujas seleccionadas sobre fondo: </span>
        <AccessibilityIndicator status={report.selectedBubbleOnBackground} />
      </div>

    </div>
  );
};
