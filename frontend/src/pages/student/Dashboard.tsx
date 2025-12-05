import {
  IonPage,
  IonContent,
  IonSpinner,
  useIonRouter,
  IonIcon
} from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';

import SimpleHeaderUser from './components/SimpleHeaderUser';
import { SimpleButton } from '../global_components/SimpleButton';
import './Dashboard.css';
import { useUserData } from '../../contexts/UserContext';
import { Button3Dtext } from '../global_components/PushableButtons';
import { arrowBack } from 'ionicons/icons';


/**
 * Permite al alumno autenticado:
 * - Ver su nombre y foto (o inicial si no tiene imagen).
 * - Acceder a las secciones de juegos y progreso.
 * - Cerrar sesión y volver a la página principal.
 *
 * Muestra un *spinner* mientras se carga el estado de autenticación
 * y redirige a `/student/login` si no hay sesión activa.
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
          <section className="dashboard-section">
            <div className="games-container">
              <SimpleButton onClick={() => router.push('/game/game1')}>
                <img src="/assets/juegosImg/juego1.png" alt="Juego 1" className="simple-button-image" />
                <div className="simple-button-title">Toca el numero que suena</div>
              </SimpleButton>

              <SimpleButton onClick={() => router.push('/game/game2')}>
                <img src="/assets/juegosImg/juego2.png" alt="Juego 2" className="simple-button-image" />
                <div className="simple-button-title">Ordena la secuencia</div>
              </SimpleButton>

              <SimpleButton onClick={() => router.push('/game/game3')}>
                <img src="/assets/juegosImg/juego3.png" alt="Juego 3" className="simple-button-image" />
                <div className="simple-button-title">Repartir los números</div>
              </SimpleButton>

              <SimpleButton onClick={() => router.push('/game/game4')}>
                <img src="/assets/juegosImg/juego4.png" alt="Juego 4" className="simple-button-image" />
                <div className="simple-button-title">Igualar los recipientes</div>
              </SimpleButton>
            </div>
          </section>
        )}

      </IonContent>
    </IonPage>
  );
}
