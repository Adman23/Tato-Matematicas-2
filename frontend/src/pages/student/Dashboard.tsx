

import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  useIonRouter
} from '@ionic/react';
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
 * <Route path="/student/dashboard" component={StudentDashboard} />
 * ```
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  const { loadingUser } = useUserData();
  const router = useIonRouter();


  /*
  // Redirigir si no hay estudiante autenticado
  if (!user) {
    console.log("Redirect to login because ther is no user");
    return <Redirect to="/student/login" />;
  }
  */

  

  return (
    <IonPage>

      
      <SimpleHeaderUser userName={user?.username || "username"} photoUrl={user?.photo_url} />

      <IonContent className="student-dashboard-content">
        {loadingUser ? (
          // --- ESTADO DE CARGA ---
          // Usamos un div contenedor para centrar, no el IonContent directamente
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
        <div className="games-container">
          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => router.push('/game/game1')}
            >
              <div className="game-button-content">
                <img src="/assets/juegosImg/juego1.png" alt="Juego 1" className="game-image" />
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
                <img src="/assets/juegosImg/juego2.png" alt="Juego 2" className="game-image" />
                <div className="game-title">Ordena la secuencia</div>
              </div>
            </IonButton>
          </div>

          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => router.push('/game/game3')}
            >
              <div className="game-button-content">
                <img src="/assets/juegosImg/juego3.png" alt="Juego 3" className="game-image" />
                <div className="game-title">Repartir los números</div>
              </div>
            </IonButton>
          </div>

          <div className="game-button-wrapper">
            <IonButton
              className="game-button"
              onClick={() => router.push('/game/game4')}
            >
              <div className="game-button-content">
                <img src="/assets/juegosImg/juego4.png" alt="Juego 4" className="game-image" />
                <div className="game-title">Igualar los recipientes</div>
              </div>
            </IonButton>
          </div>
        </div>
        )}

      </IonContent>
    </IonPage>
  );
}
