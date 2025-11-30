
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  useIonRouter
} from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserContext';
import { useManager } from '../../contexts/ManagerContext';
import SimpleHeaderUser from '../student/components/SimpleHeaderUser';
import '../student/Dashboard.css';



export default function TutorDashboard() {
  const { user } = useAuth();
  const { loadingUser } = useUserData();
  const { loadingUsers } = useManager();
  const router = useIonRouter();

  // Mostrar spinner mientras carga
  if (loadingUser || loadingUsers) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  /*
  // Redirigir si no hay usuario autenticado o no es tutor
  if (!user || user.role !== 'teacher') {
    return <Redirect to="/login" />;
  }
  */


  return (
    <IonPage>
      <SimpleHeaderUser userName={user?.username || "username"} photoUrl={user?.photo_url} />

      <IonContent className="student-dashboard-content">
        <div className="games-container">
          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => router.push('/game/game1')}
            >
              <div className="game-button-content">
                <img src="/assets/juegosImg/juego2.png" alt="Juego 1" className="game-image" />
                <div className="game-title">Toca el numero que suena</div>
              </div>
            </IonButton>
          </div>

          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => router.push('/game/game2')}
            >
              <div className="game-button-content">
                <img src="/assets/juegosImg/juegoX.png" alt="Juego 2" className="game-image" />
                <div className="game-title">Ordena la secuencia</div>
              </div>
            </IonButton>
          </div>

          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => router.push('/game3')}
            >
              <div className="game-button-content">
                <img src="/assets/juegosImg/repartir.png" alt="Juego 3" className="game-image" />
                <div className="game-title">Juego de repartir</div>
              </div>
            </IonButton>
          </div>

          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => router.push('/game4')}
            >
              <div className="game-button-content">
                <img src="/assets/juegosImg/meter.png" alt="Juego 4" className="game-image" />
                <div className="game-title">Igualar recipientes</div>
              </div>
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

