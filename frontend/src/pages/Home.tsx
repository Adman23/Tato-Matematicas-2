import {
  IonPage,
  IonContent,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="home-content">
        <div className="home-container">
          {/* Logo y título */}
          <div className="home-header">
            <h1 className="home-title">TatoMaths</h1>
            <p className="home-subtitle">¿Quién va a jugar?</p>
          </div>

          {/* Botones de acceso */}
          <div className="home-buttons">
            <button
              className="home-button tatomaths-button tatomaths-button-tutor"
              onClick={() => history.push('/login')}
              aria-label="Acceso para tutores y administradores"
            >
              <div className="home-button-content">
                <img
                  src="/assets/pictograms/tutorAdmin.png"
                  alt="Tutor o Administrador"
                  className="tatomaths-image"
                />
                <span className="tatomaths-label">Tutor</span>
              </div>
            </button>

            <button
              className="home-button tatomaths-button tatomaths-button-student"
              onClick={() => history.push('/student-login')}
              aria-label="Acceso para estudiantes"
            >
              <div className="home-button-content">
                <img
                  src="/assets/pictograms/student.png"
                  alt="Estudiante"
                  className="tatomaths-image"
                />
                <span className="tatomaths-label">Estudiante</span>
              </div>
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
