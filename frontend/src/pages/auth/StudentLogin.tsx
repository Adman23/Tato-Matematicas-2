/**
 * Pantalla de acceso para estudiantes mediante pictogramas.
 * ---------------------------------------------------------
 * El estudiante selecciona una secuencia de pictogramas (animales) y,
 * si coincide con la registrada en backend, se le autentica y redirige
 * a su panel (`/student-dashboard`).
 *
 * Utiliza:
 * - **Ionic React** (estructura y botones).
 * - **AuthContext** (`useAuth`) para `loginStudent`.
 * - **React Router** (`useHistory`) para navegar tras el login.
 * - Estilos en `StudentLogin.css`.
 */

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonIcon,
} from '@ionic/react';
import { arrowBackOutline, trashOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './StudentLogin.css';

/** Pictogramas disponibles para componer la clave visual del estudiante. */
const PICTOGRAMS = [
  { id: 'perro', name: 'Perro', image: '/assets/pictograms/perro.png' },
  { id: 'gato', name: 'Gato', image: '/assets/pictograms/gato.png' },
  { id: 'tortuga', name: 'Tortuga', image: '/assets/pictograms/tortuga.png' },
  { id: 'león', name: 'León', image: '/assets/pictograms/león.png' },
  { id: 'elefante', name: 'Elefante', image: '/assets/pictograms/elefante.png' },
];

/** Longitud mínima requerida para validar la secuencia. */
const REQUIRED_LENGTH = 3; // Longitud mínima de la secuencia


/**
 * Pantalla de login de estudiante por secuencia de pictogramas.
 *
 * Flujo:
 * 1) El alumno toca pictogramas para formar su secuencia.
 * 2) Se valida la longitud mínima.
 * 3) Se envía a `loginStudent({ pictos })` y, si es correcta, se redirige.
 *
 * Muestra mensajes de error cuando la secuencia es incompleta o incorrecta.
 *
 * @returns {JSX.Element} Interfaz de autenticación de estudiantes.
 *
 * @example
 * ```tsx
 * <Route path="/student-login" component={StudentLogin} />
 * ```
 */
export default function StudentLogin() {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { loginStudent } = useAuth();

  /**
 * Añade un pictograma a la secuencia seleccionada.
 * @param pictogramId Identificador del pictograma elegido.
 */
  const addPicto = (pictogramId: string) => {
    setSelected([...selected, pictogramId]);
    setError('');
  };

  /** Limpia la secuencia actual y cualquier error mostrado. */
  const clearSequence = () => {
    setSelected([]);
    setError('');
  };

  /**
   * Intenta autenticar al estudiante con la secuencia actual.
   * - Valida longitud mínima.
   * - Llama a `loginStudent`.
   * - Redirige a `/student-dashboard` si es correcta.
   * - Muestra error y limpia secuencia si es incorrecta.
   */
  const handleLogin = async () => {
    // Validación: secuencia incompleta
    if (selected.length < REQUIRED_LENGTH) {
      setError('Aún faltan imágenes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginStudent({ pictos: selected });
      // Redirigir al dashboard de estudiante
      history.push('/student-dashboard');
    } catch (err: any) {
      // Secuencia incorrecta
      setError('Oh, te has equivocado, inténtalo otra vez');
      setSelected([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="secondary">
          <IonTitle className="student-login-title" >Acceso Estudiante</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="student-login-content">
        <div className="student-login-container">
          {/* Título */}
          <div className="student-login-header">
            <h1 className="student-login-title">¡Hola! Selecciona tu clave</h1>
            <p className="student-login-subtitle">
              Toca {REQUIRED_LENGTH} animales en el orden correcto
            </p>
          </div>

          {/* Secuencia seleccionada */}
          <div className="student-sequence-display">
            {selected.length === 0 ? (
              <p className="student-sequence-placeholder">
                Tu secuencia aparecerá aquí...
              </p>
            ) : (
              <div className="student-sequence-items">
                {selected.map((pictogramId, index) => {
                  const picto = PICTOGRAMS.find(p => p.id === pictogramId);
                  return (
                    <div key={`${pictogramId}-${index}`} className="student-sequence-item">
                      <img
                        src={picto?.image}
                        alt={picto?.name}
                        className="student-sequence-image"
                      />
                      {/* <span className="student-sequence-number">{index + 1}</span> */}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grid de pictogramas */}
          <div className="student-pictograms-grid">
            {PICTOGRAMS.map((picto) => (
              <button
                key={picto.id}
                onClick={() => addPicto(picto.id)}
                disabled={loading}
                className="student-pictogram-button"
                aria-label={picto.name}
              >
                <img
                  src={picto.image}
                  alt={picto.name}
                  className="student-pictogram-image"
                />
              </button>
            ))}
          </div>

          {/* Mensaje de error */}
          {error && (
            <IonText color="danger">
              <div className="student-error-message">
                <p>{error}</p>
              </div>
            </IonText>
          )}

          {/* Botones de acción */}
          <div className="student-actions">
            <IonButton
              expand="block"
              onClick={handleLogin}
              disabled={loading || selected.length === 0}
              size="large"
              className="student-login-button"
              aria-label={loading ? 'Verificando credenciales' : 'Entrar como estudiante'}

            >
              {loading ? 'Verificando...' : '✓ Entrar'}
            </IonButton>

            <IonButton
              expand="block"
              color="medium"
              fill="outline"
              onClick={clearSequence}
              disabled={loading || selected.length === 0}
              size="large"
            >
              <IonIcon icon={trashOutline} slot="start" />
              Borrar
            </IonButton>


            {/* Botón volver */}
            <IonButton
              expand="block"
              fill="clear"
              onClick={() => history.push('/')}
              className="student-back-button"
            >
              <IonIcon icon={arrowBackOutline} slot="start" />
              Volver
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
