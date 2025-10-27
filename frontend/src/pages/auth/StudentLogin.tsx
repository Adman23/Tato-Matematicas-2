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
  IonContent,
  IonButton,
  IonText,
} from '@ionic/react';
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
const MAX_LENGTH = 4;

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
   * - Llama a `loginStudent`.
   * - Redirige a `/student-dashboard` si es correcta.
   * - Muestra error y limpia secuencia si es incorrecta.
   */
  const handleLogin = async () => {
    // Validación: secuencia incompleta
    if (selected.length < REQUIRED_LENGTH ) {
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
        </IonToolbar>
      </IonHeader>

      <IonContent className="student-login-content">
        <div className="student-login-container">
          <IonButton
            fill="clear"
            className="student-volver-boton"
            onClick={() => history.goBack()}
          >
            <img
              src="/assets/pictograms/boton_volver.png"
              alt="Volver"
              className="student-boton-imagen"
            />
          </IonButton>

          {/* Título y arriba */}
          <div className="student-login-header">
            <img
              src="/assets/pictograms/contrasena.png"
              alt="imagen de contraseña"
              className="student-login-image"
            />

            <h1 className="student-login-title">Selecciona tu clave</h1>
            <p className="student-login-subtitle">
              Toca {REQUIRED_LENGTH} animales en el orden correcto
            </p>
          </div>

          {/* Secuencia seleccionada con botón borrar a la derecha */}
          <div className="student-sequence-row">
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <IonButton
              fill="clear"
              className="student-borrar-boton"
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
              fill="clear"
              className="student-avance-boton"
              onClick={handleLogin}
              disabled={loading}
            >
              <img
                src="/assets/pictograms/boton_volver.png"
                alt="Avanzar"
                className="student-boton-imagen"
              />
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
