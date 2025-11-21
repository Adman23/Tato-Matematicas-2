/**
 * !! EDITED
 *  -> Now there is no student
 * 
 * Pantalla de Paso 3: Secuencia de Pictogramas (Contraseña)
 * ---------------------------------------------------------
 * El estudiante selecciona una secuencia de pictogramas (animales) que
 * es su contraseña. Si coincide con la registrada en backend, se le
 * autentica y redirige a su panel (`/student-dashboard`).
 *
 * Utiliza:
 * - **Ionic React** (estructura y botones).
 * - **AuthContext** (`useAuth`) para `login`.
 * - **React Router** (`useHistory`, `useParams`) para navegación y parámetros.
 * - Estilos en `StudentLoginAuth.css`.
 */

import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  useIonViewWillEnter,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './StudentLoginAuth.css';

/** Pictogramas disponibles para componer la clave visual del estudiante. */
const PICTOGRAMS = [
  { id: 'perro', name: 'Perro', image: '/assets/pictograms/perro.png' },
  { id: 'gato', name: 'Gato', image: '/assets/pictograms/gato.png' },
  { id: 'tortuga', name: 'Tortuga', image: '/assets/pictograms/tortuga.png' },
  { id: 'león', name: 'León', image: '/assets/pictograms/león.png' },
  { id: 'elefante', name: 'Elefante', image: '/assets/pictograms/elefante.png' },
];

/** Longitud mínima requerida para validar la secuencia. */
const REQUIRED_LENGTH = 3;
const MAX_LENGTH = REQUIRED_LENGTH;

/**
 * Paso 3 del login de estudiante: Secuencia de pictogramas (contraseña).
 */
export default function StudentLoginStep3() {
  const params = useParams<{ groupId: string; username: string }>();
  const history = useHistory();
  const { login } = useAuth();

  // Extract groupId and username from URL pathname as fallback
  const pathParts = history.location.pathname.split('/');
  const groupId = params.groupId || pathParts[pathParts.length - 2] || '';
  const username = params.username || pathParts[pathParts.length - 1] || '';

  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Resetear secuencia cada vez que la vista se muestra
  useIonViewWillEnter(() => {
    setSelected([]);
    setError('');
  });

  // Temporizador para ocultar el mensaje de error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const addPicto = (pictogramId: string) => {
    setSelected(prev => {
      if (prev.length >= MAX_LENGTH) {
        setError(`Máximo ${MAX_LENGTH} imágenes`);
        return prev;
      }
      setError('');

      const newSequence = [...prev, pictogramId];

      // Auto-submit al completar los 3 pictogramas
      if (newSequence.length === REQUIRED_LENGTH) {
        setTimeout(() => {
          handleLoginWithSequence(newSequence);
        }, 100);
      }

      return newSequence;
    });
  };

  const removeLastPictogram = () => {
    setSelected(prev => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
    setError('');
  };

  const handleLoginWithSequence = async (sequence: string[]) => {
    if (sequence.length < REQUIRED_LENGTH) {
      setError('Aún faltan imágenes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const password = sequence.join('-');

      await login({
        group_id: groupId,
        username: username,
        password: password
      });

      setSelected([]);
      setError('');
      console.log("A");
      history.push('/student-dashboard');
    } catch (err: any) {
      setError('Oh, te has equivocado, inténtalo otra vez');
      setSelected([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    handleLoginWithSequence(selected);
  };

  return (
    <IonPage>
      <IonContent className="student-login-content">
        <div className="auth-login-container">
          {/* Fila de botones superior */}
          <div className="auth-button-row">
            <IonButton
              fill="clear"
              className="auth-action-button"
              onClick={() => history.goBack()}
            >
              <img
                src="/assets/pictograms/boton_volver.png"
                alt="Volver"
                className="auth-boton-imagen"
              />
            </IonButton>

            <IonButton
              fill="clear"
              className="auth-action-button"
              onClick={() => history.push('/')}
            >
              <img
                src="/assets/pictograms/home.png"
                alt="Volver a la página principal"
                className="auth-boton-imagen"
              />
            </IonButton>

            <IonButton
              fill="clear"
              className="auth-action-button"
              onClick={handleLogin}
              disabled={loading}
            >
              <img
                src="/assets/pictograms/correcto.png"
                alt="Avanzar"
                className="auth-boton-imagen"
              />
            </IonButton>
          </div>

          {/* Título y subtítulo */}
          <div className="auth-login-header">
            <img
              src="/assets/pictograms/contrasena.png"
              alt="imagen de contraseña"
              className="auth-login-image"
            />

            <h1 className="auth-login-title">Selección de clave</h1>
            <p className="auth-login-subtitle">
              Toca {REQUIRED_LENGTH} animales en el orden correcto
            </p>
          </div>

          {/* Secuencia seleccionada con botón borrar a la derecha */}
          <div className="auth-sequence-row">
            <div
              className="auth-sequence-display"
              aria-live="polite"
              aria-label="Posiciones de la contraseña"
            >
              <div className="auth-sequence-slots" role="list">
                {Array.from({ length: REQUIRED_LENGTH }, (_, index) => {
                  const pictogramId = selected[index];
                  const picto = pictogramId
                    ? PICTOGRAMS.find(p => p.id === pictogramId)
                    : null;
                  return (
                    <div
                      key={`password-slot-${index}`}
                      className={`auth-sequence-slot ${picto ? 'filled' : ''}`}
                      role="listitem"
                      aria-label={
                        picto
                          ? `Posición ${index + 1} seleccionada: ${picto.name}`
                          : `Posición ${index + 1} vacía`
                      }
                    >
                      {picto ? (
                        <img
                          src={picto.image}
                          alt={picto.name}
                          className="auth-sequence-image"
                        />
                      ) : (
                        <span className="auth-sequence-slot-placeholder">
                          Posición {index + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botón: borrar último pictograma */}
            <IonButton
              fill="clear"
              className="auth-action-button"
              onClick={removeLastPictogram}
              disabled={selected.length === 0}
            >
              <img
                src="/assets/pictograms/boton_borrar.png"
                alt="Borrar último pictograma"
                className="auth-boton-imagen"
              />
            </IonButton>
          </div>

          {/* Grid de pictogramas */}
          <div className="auth-pictograms-grid">
            {PICTOGRAMS.map((picto) => (
              <button
                key={picto.id}
                onClick={() => addPicto(picto.id)}
                disabled={loading || selected.length >= MAX_LENGTH}
                className="auth-pictogram-button"
                aria-label={picto.name}
              >
                <img
                  src={picto.image}
                  alt={picto.name}
                  className="auth-pictogram-image"
                />
              </button>
            ))}
          </div>

          {/* Mensaje de error accesible */}
          {error && (
            <IonText color="danger">
              <div className="auth-error-message">
                <div className="auth-error-icon">❌</div>
                <p>{error}</p>
              </div>
            </IonText>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}