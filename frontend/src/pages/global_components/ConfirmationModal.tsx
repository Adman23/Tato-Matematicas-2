// src/pages/global_components/ConfirmationModal.tsx

import './ConfirmationModal.css';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';

interface ConfirmationModalProps {
  title: string;
  message: string;
  redirectPath: string;
  buttonText?: string;
  isLoading?: boolean;
  loadingMessage?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  redirectPath,
  buttonText = 'Aceptar',
  isLoading = false,
  loadingMessage = 'Procesando...',
}) => {
  const handleAccept = () => {
    window.location.href = redirectPath;
  };

  if (isLoading) {
    return (
      <div className="confirmation-modal-overlay">
        <div className="confirmation-modal-loading-container">
          <IonSpinner name="crescent" className="confirmation-modal-loading-spinner" />
          <p className="confirmation-modal-loading-message">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-modal-overlay">
      <IonCard className="confirmation-modal-card">
        <IonCardHeader className="confirmation-modal-header">
          <div className="confirmation-modal-icon-container">
            <IonIcon icon={checkmarkCircle} className="confirmation-modal-icon" />
          </div>
          <IonCardTitle className="confirmation-modal-title">
            {title}
          </IonCardTitle>
        </IonCardHeader>

        <IonCardContent className="confirmation-modal-message">
          {message}
        </IonCardContent>

        <IonButton
          expand="block"
          className="confirmation-modal-button"
          onClick={handleAccept}
        >
          {buttonText}
        </IonButton>
      </IonCard>
    </div>
  );
};

export default ConfirmationModal;
