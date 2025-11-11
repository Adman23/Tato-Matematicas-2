
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner
} from '@ionic/react';
import { Redirect, useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SimpleHeaderUser from '../student/components/SimpleHeaderUser';
import '../student/Dashboard.css';



export default function TutorDashboard() {
  const { user, loading } = useAuth();
  const history = useHistory();

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

  // Redirigir si no hay usuario autenticado o no es tutor
  if (!user || user.role !== 'teacher') {
    return <Redirect to="/login" />;
  }


  return (
    <IonPage>
      <SimpleHeaderUser userName={user.username} photoUrl={user.photo_url} />

      <IonContent className="student-dashboard-content">
        <div className="games-container">
          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => history.push('/game1')}
            >
              <div className="game-button-content">
                <img src="/juego2.png" alt="Juego 1" className="game-image" />
                <div className="game-title">Toca el numero que suena</div>
              </div>
            </IonButton>
          </div>

          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => history.push('/game2')}
            >
              <div className="game-button-content">
                <img src="/juegoX.png" alt="Juego 2" className="game-image" />
                <div className="game-title">Ordena la secuencia</div>
              </div>
            </IonButton>
          </div>

          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => history.push('/game3')}
            >
              <div className="game-button-content">
                <img src="/repartir.png" alt="Juego 3" className="game-image" />
                <div className="game-title">Juego de repartir</div>
              </div>
            </IonButton>
          </div>

          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => history.push('/game4')}
            >
              <div className="game-button-content">
                <img src="/meter.png" alt="Juego 4" className="game-image" />
                <div className="game-title">Igualar recipientes</div>
              </div>
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

