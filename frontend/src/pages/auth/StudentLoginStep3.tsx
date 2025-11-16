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
 * - **AuthContext** (`useAuth`) para `loginStudent`.
 * - **React Router** (`useHistory`, `useParams`) para navegación y parámetros.
 * - Estilos en `StudentLogin.css`.
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
const MAX_LENGTH = REQUIRED_LENGTH; // Se muestran solo 3 posiciones fijas

/**
 * Paso 3 del login de estudiante: Secuencia de pictogramas (contraseña).
 *
 * Flujo:
 * 1) El alumno toca pictogramas para formar su secuencia.
 * 2) Se valida la longitud mínima.
 * 3) Se envía a `loginStudent({ group_id, username, password })` y, si es correcta, se redirige.
 *
 * Muestra mensajes de error cuando la secuencia es incompleta o incorrecta.
 */
export default function StudentLoginStep3() {
  const params = useParams<{ groupId: string; username: string }>();
  const history = useHistory();
  const { login } = useAuth();

  // Extract groupId and username from URL pathname as fallback (IonReactRouter issue workaround)
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

  // Temporizador para ocultar el mensaje de error después de 4 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 4000); // 4 segundos

      // Limpiar el temporizador si el componente se desmonta o el error cambia
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
 * Añade un pictograma a la secuencia seleccionada.
 * @param pictogramId Identificador del pictograma elegido.
 */
  // Añade un pictograma si no se ha alcanzado el máximo
  const addPicto = (pictogramId: string) => {
    setSelected(prev => {
      if (prev.length >= MAX_LENGTH) {
        setError(`Máximo ${MAX_LENGTH} imágenes`);
        return prev; // no añade más
      }
      setError('');
      return [...prev, pictogramId];
    });
  };


  /** Limpia la secuencia actual y cualquier error mostrado. */
  const clearSequence = () => {
    setSelected([]);
    setError('');
  };

  /**
   * Intenta autenticar al estudiante con la secuencia actual.
   * - Valida longitud mínima.
   * - Llama a `loginStudent` con group_id, username y password (secuencia unida por guiones).
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
      // Convertir array de pictogramas a string con guiones: "perro-gato-león"
      const password = selected.join('-');

      await login({
        group_id: groupId,
        username: username,
        password: password
      });

      setSelected([]);
      setError('');
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
      <IonContent className="student-login-content">
        <div className="student-login-container">

          {/* Fila de botones superior */}
          <div className="student-button-row">
            <IonButton
              fill="clear"
              className="default-action-button"
              onClick={() => history.goBack()}
            >
              <img
                src="/assets/pictograms/boton_volver.png"
                alt="Volver"
                className="student-boton-imagen"
              />
             
            </IonButton>

              <IonButton
              fill="clear"
              className="default-action-button"
              onClick={() => history.push('/')}
            >
              <img
                src="/assets/pictograms/home.png"
                alt="Volver a la pagina principal"
                className="student-boton-imagen"
              />
            </IonButton>

            <IonButton
              fill="clear"
              className="default-action-button"
              onClick={handleLogin}
              disabled={loading}
            >
              <img
                src="/assets/pictograms/correcto.png"
                alt="Avanzar"
                className="student-boton-imagen"
              />

            </IonButton>
          </div>

          {/* Título y arriba */}
          <div className="student-login-header">
            <img
              src="/assets/pictograms/contrasena.png"
              alt="imagen de contraseña"
              className="student-login-image"
            />

            <h1 className="student-login-title">Selección de clave</h1>
            <p className="student-login-subtitle">
              Toca {REQUIRED_LENGTH} animales en el orden correcto
            </p>
          </div>

          {/* Secuencia seleccionada con botón borrar a la derecha */}
          <div className="student-sequence-row">
            <div
              className="student-sequence-display"
              aria-live="polite"
              aria-label="Posiciones de la contraseña"
            >
              <div className="student-sequence-slots" role="list">
                {Array.from({ length: REQUIRED_LENGTH }, (_, index) => {
                  const pictogramId = selected[index];
                  const picto = pictogramId
                    ? PICTOGRAMS.find(p => p.id === pictogramId)
                    : null;
                  return (
                    <div
                      key={`password-slot-${index}`}
                      className={`student-sequence-slot ${picto ? 'filled' : ''}`}
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
                          className="student-sequence-image"
                        />
                      ) : (
                        <span className="student-sequence-slot-placeholder">
                          Posición {index + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Boton borrar */}
            <IonButton
              fill="clear"
              className="default-action-button"
              onClick={clearSequence}
            >
              <img
                src="/assets/pictograms/boton_borrar.png"
                alt="Borrar"
                className="student-boton-imagen"
              />
            </IonButton>
          </div>

          {/* Grid de pictogramas */}
          <div className="student-pictograms-grid">
            {PICTOGRAMS.map((picto) => (
              <button
                key={picto.id}
                onClick={() => addPicto(picto.id)}
                disabled={loading || selected.length >= MAX_LENGTH}
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

          {/* Mensaje de error accesible */}
          {error && (
            <IonText color="danger">
              <div className="student-error-message">
                <div className="student-error-icon">❌</div>
                <p>{error}</p>
              </div>
            </IonText>
          )}


        </div>
      </IonContent>
    </IonPage>
  );
}
