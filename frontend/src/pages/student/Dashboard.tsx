

import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner
} from '@ionic/react';
import { Redirect, useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import SimpleHeaderUser from './components/SimpleHeaderUser';
import './Dashboard.css';
import { useUserData } from '../../contexts/UserContext';


/**
 * 
 * !! EDITED
 *  -> Now there is no "student" only user
 * Componente funcional que representa el panel del estudiante.
 *
 * Permite al alumno autenticado:
 * - Ver su nombre y foto (o inicial si no tiene imagen).
 * - Acceder a las secciones de juegos y progreso.
 * - Cerrar sesión y volver a la página principal.
 *
 * Muestra un *spinner* mientras se carga el estado de autenticación
 * y redirige a `/student-login` si no hay sesión activa.
 *
 * @returns {JSX.Element} Interfaz del panel principal del estudiante.
 *
 * @example
 * ```tsx
 * import StudentDashboard from "./pages/student/Dashboard";
 *
 * <Route path="/student-dashboard" component={StudentDashboard} />
 * ```
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  const { loadingUser } = useUserData();
  const history = useHistory();


  // Mostrar spinner mientras carga
  if (loadingUser) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  // Redirigir si no hay estudiante autenticado
  if (!user) {
    console.log("Redirect to login because ther is no user");
    return <Redirect to="/student-login" />;
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
                <img src="/assets/juegosImg/juego2.png" alt="Juego 1" className="game-image" />
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
                <img src="/assets/juegosImg/juegoX.png" alt="Juego 2" className="game-image" />
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
                <img src="/assets/juegosImg/repartir.png" alt="Juego 3" className="game-image" />
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
