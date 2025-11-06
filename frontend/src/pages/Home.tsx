/**
 * Página de inicio de TatoMaths.
 * ------------------------------------------------------
 * Muestra la pantalla principal donde el usuario elige si acceder
 * como **tutor/administrador** o como **estudiante**.
 *
 * Utiliza:
 * - **Ionic React** (`IonPage`, `IonContent`) para la estructura visual.
 * - **React Router** (`useHistory`) para navegación programática.
 * - Estilos definidos en `Home.css` para diseño y personalización.
 */

import {
  IonPage,
  IonContent,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Home.css';

/**
 * Componente principal de la pantalla de inicio.
 *
 * Permite seleccionar el tipo de usuario que va a iniciar sesión:
 * - Tutor o Administrador → redirige a `/login`.
 * - Estudiante → redirige a `/student-login`.
 *
 * @returns {JSX.Element} Página inicial de selección de tipo de usuario.
 *
 * @example
 * ```tsx
 * import Home from "./pages/Home";
 * 
 * <Route path="/" exact component={Home} />
 * ```
 */
export default function Home() {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="home-content">
        <div className="home-container">
          {/* Logo y título */}
          <div className="home-header">
            <h1 className="home-title">Tato Matemáticas 2</h1>
            <p className="home-subtitle">¿Quién va a jugar?</p>
          </div>

          {/* Botones de acceso */}
          <div className="home-buttons">
            <button
              className=" tatomaths-button"
              onClick={() => history.push('/login')}
              aria-label="Acceso para tutores y administradores"
            >
              <div className="home-button-content">
                <img
                  src="/assets/pictograms/tutorAdmin.png"
                  alt="Tutor o Administrador"
                  className="tatomaths-image"
                />
                {/* <span className="tatomaths-label">Tutor</span> */}
              </div>
            </button>

            <button
              className=" tatomaths-button "
              onClick={() => history.push('/student-login')}
              aria-label="Acceso para estudiantes"
            >
              <div className="home-button-content">
                <img
                  src="/assets/pictograms/students.png"
                  alt="Estudiante"
                  className="tatomaths-image"
                />
                {/* <span className="tatomaths-label">Estudiante</span> */}
              </div>
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
