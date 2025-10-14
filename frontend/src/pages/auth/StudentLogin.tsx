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

// Pictogramas de animales disponibles (5 para simplicidad)
const PICTOGRAMS = [
  { id: 'perro', name: 'Perro', image: '/assets/pictograms/perro.png' },
  { id: 'gato', name: 'Gato', image: '/assets/pictograms/gato.png' },
  { id: 'tortuga', name: 'Tortuga', image: '/assets/pictograms/tortuga.png' },
  { id: 'león', name: 'León', image: '/assets/pictograms/león.png' },
  { id: 'elefante', name: 'Elefante', image: '/assets/pictograms/elefante.png' },
];

const REQUIRED_LENGTH = 3; // Longitud mínima de la secuencia

export default function StudentLogin() {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { loginStudent } = useAuth();

  const addPicto = (pictogramId: string) => {
    setSelected([...selected, pictogramId]);
    setError('');
  };

  const clearSequence = () => {
    setSelected([]);
    setError('');
  };

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
          <IonTitle>Acceso Estudiante</IonTitle>
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
                      <span className="student-sequence-number">{index + 1}</span>
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
          </div>

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
      </IonContent>
    </IonPage>
  );
}
