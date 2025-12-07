// src/pages/RegisterConfirmation.tsx

import './RegisterConfirmation.css';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';
import { useParams, Redirect } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SimpleHeaderAdmin from '../admin/components/SimpleHeaderAdmin';

const RegisterConfirmation = () => {
  const { tipo } = useParams<{ tipo: string }>();
  const { user, loadingAuth: loading } = useAuth();

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center ion-padding-top">
          <div className="ion-text-center">Cargando...</div>
        </IonContent>
      </IonPage>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Redirect to="/login" />;
  }

  const isValidType = tipo === 'profesores' || tipo === 'alumnos' || tipo === 'grupos';

  const handleAccept = () => {
    if (isValidType && tipo === 'grupos') {
      window.location.href = '/admin-dashboard/groups-management';
    } else if (isValidType && tipo === 'alumnos') {
      window.location.href = '/admin/dashboard/alumnos';
    } else if (isValidType && tipo !== 'grupos') {
      window.location.href = `/admin-dashboard/${tipo}`;
    } else {
      window.location.href = '/admin-dashboard';
    }
  };

  const getMessage = () => {
    if (tipo === 'profesores') return 'Profesor registrado con éxito.';
    if (tipo === 'alumnos') return 'Alumno registrado con éxito.';
    if (tipo === 'grupos') return 'Grupo registrado con éxito.';
    return 'Registro completado con éxito.';
  };

  const getTitle = () => {
    if (tipo === 'profesores') return 'Profesor registrado';
    if (tipo === 'alumnos') return 'Alumno registrado';
    if (tipo === 'grupos') return 'Grupo registrado';
    return 'Completado';
  };

  return (
    <IonPage>
      <SimpleHeaderAdmin adminName={user.username} />
      <IonContent className="register-confirmation-content">
        <div className="center-container">
          <IonCard className="register-confirmation-card">
            <IonCardHeader className="register-confirmation-card-header">
              <div className="register-confirmation-icon-container">
                <IonIcon icon={checkmarkCircle} className="register-confirmation-icon" />
              </div>
              <IonCardTitle className="register-confirmation-subtitle">
                {getTitle()}
              </IonCardTitle>
            </IonCardHeader>

            <IonCardContent className="register-confirmation-message">
              {getMessage()}
            </IonCardContent>

            <IonButton
              expand="block"
              className="register-confirmation-button"
              onClick={handleAccept}
            >
              Aceptar
            </IonButton>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RegisterConfirmation;