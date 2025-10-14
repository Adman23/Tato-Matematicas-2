import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { gameControllerOutline, trophyOutline, logOutOutline } from 'ionicons/icons';
import { Redirect, useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const { student, logout, loading } = useAuth();
  const history = useHistory();

  const handleLogout = async () => {
    await logout();
    history.replace('/');
  };

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  // Redirigir si no hay estudiante autenticado
  if (!student) {
    return <Redirect to="/student-login" />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="secondary">
          <IonTitle>TatoMaths - {student.full_name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ maxWidth: '800px', margin: '40px auto' }}>
          {/* Bienvenida */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={student.full_name}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--ion-color-secondary)',
                  marginBottom: '16px'
                }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--ion-color-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  marginBottom: '16px',
                  color: 'white'
                }}
              >
                {student.full_name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>
              ¡Hola, {student.full_name}!
            </h1>
            <p style={{ color: 'var(--ion-color-medium)', fontSize: '18px' }}>
              ¿Qué quieres hacer hoy?
            </p>
          </div>

          {/* Opciones de juegos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <IonCard button style={{ margin: 0 }}>
              <IonCardContent style={{ padding: '32px', textAlign: 'center' }}>
                <IonIcon
                  icon={gameControllerOutline}
                  style={{ fontSize: '64px', color: 'var(--ion-color-primary)' }}
                />
                <h2 style={{ margin: '16px 0 8px 0' }}>Jugar</h2>
                <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '14px' }}>
                  Juegos de matemáticas
                </p>
              </IonCardContent>
            </IonCard>

            <IonCard button style={{ margin: 0 }}>
              <IonCardContent style={{ padding: '32px', textAlign: 'center' }}>
                <IonIcon
                  icon={trophyOutline}
                  style={{ fontSize: '64px', color: 'var(--ion-color-warning)' }}
                />
                <h2 style={{ margin: '16px 0 8px 0' }}>Mi Progreso</h2>
                <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '14px' }}>
                  Ver mis logros
                </p>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Botón de salir */}
          <IonButton
            expand="block"
            color="medium"
            onClick={handleLogout}
            size="large"
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Salir
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
