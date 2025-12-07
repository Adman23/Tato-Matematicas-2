// src/pages/global_components/LoadingSpinner.tsx

import './LoadingSpinner.css';
import { IonSpinner } from '@ionic/react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Procesando...',
}) => {
  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner-container">
        <IonSpinner name="crescent" className="loading-spinner-icon" />
        <p className="loading-spinner-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
