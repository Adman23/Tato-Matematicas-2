import {
  IonPage,
  IonContent,
  IonSpinner,
  useIonRouter
} from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserContext';
import { useManager } from '../../contexts/ManagerContext';
import SimpleHeaderUser from '../student/components/SimpleHeaderUser';
import { SimpleButton } from '../global_components/SimpleButton';
import '../student/Dashboard.css';
import LoadingSpinner from '../global_components/LoadingSpinner';

export default function TutorDashboard() {
  const { user } = useAuth();
  const { loadingUser } = useUserData();
  const { loadingUsers } = useManager();
  const router = useIonRouter();

  // Mostrar spinner mientras carga
  if (loadingUser || loadingUsers) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <LoadingSpinner message="Cargando menú de juegos" />
        </IonContent>
      </IonPage >
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
      <SimpleHeaderUser
        userName={user?.username || "username"}
        photoUrl={user?.photo_url}
      />

      <IonContent className="student-dashboard-content">
        {loadingUser || loadingUsers ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <section className="dashboard-section">
            <div className="games-container">
              <SimpleButton onClick={() => router.push('/game/game1')}>
                <img src="/assets/juegosImg/juego2.png" alt="Juego 1" className="simple-button-image" />
                <div className="simple-button-title">Toca el numero que suena</div>
              </SimpleButton>

              <SimpleButton onClick={() => router.push('/game/game2')}>
                <img src="/assets/juegosImg/juegoX.png" alt="Juego 2" className="simple-button-image" />
                <div className="simple-button-title">Ordena la secuencia</div>
              </SimpleButton>

              <SimpleButton onClick={() => router.push('/game3')}>
                <img src="/assets/juegosImg/repartir.png" alt="Juego 3" className="simple-button-image" />
                <div className="simple-button-title">Juego de repartir</div>
              </SimpleButton>

              <SimpleButton onClick={() => router.push('/game/game4')}>
                <img src="/assets/juegosImg/meter.png" alt="Juego 4" className="simple-button-image" />
                <div className="simple-button-title">Igualar recipientes</div>
              </SimpleButton>
            </div>
          </section>
        )}
      </IonContent>
    </IonPage>
  );
}

