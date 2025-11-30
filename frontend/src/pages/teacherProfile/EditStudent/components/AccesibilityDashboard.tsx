import type { AccessibilityReport } from "../types/report";
import AccessibilityIndicator from "./AccesibilityIndicator";

export interface AccessibilityDashboardProps {
  report: AccessibilityReport; // ahora acepta "checking"
}

export const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({ report }) => {
  return (
    <div className="accessibility-dashboard">
      <div>
        <span>Texto sobre principal: </span>
        <AccessibilityIndicator status={report.textOnPrimary} />
      </div>
      <div>
        <span>Texto sobre fondo: </span>
        <AccessibilityIndicator status={report.textOnBackground} />
      </div>
      <div>
        <span>Primario sobre fondo: </span>
        <AccessibilityIndicator status={report.primaryOnBackground} />
      </div>

    </div>
  );
};
