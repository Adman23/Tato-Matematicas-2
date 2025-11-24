import React from "react";
import "./AccesibilityIndicator.css";

type Props = {
  status: "aa" | "aaa" | "fail" | "checking";
};

export const AccessibilityIndicator: React.FC<Props> = ({ status }) => {
  const renderLabel = () => {
    switch (status) {
      case "aa":
        return (
          <>
            <span className="indicator-dot aa"></span>
            <span className="indicator-text">Accesible (AA)</span>
          </>
        );
      case "aaa":
        return (
          <>
            <span className="indicator-dot aaa"></span>
            <span className="indicator-text">Accesible (AAA)</span>
          </>
        );
      case "fail":
        return (
          <>
            <span className="indicator-dot fail"></span>
            <span className="indicator-text">No accesible</span>
          </>
        );
      default:
        return (
          <>
            <span className="indicator-dot checking"></span>
            <span className="indicator-text">Analizando…</span>
          </>
        );
    }
  };

  return <div className="accessibility-indicator">{renderLabel()}</div>;
};

export default AccessibilityIndicator;
