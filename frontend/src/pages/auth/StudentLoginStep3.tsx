import {
  IonPage,
  IonContent,
  IonText,
  IonIcon,
  useIonViewWillEnter,
  useIonRouter,
} from '@ionic/react';
import { arrowBack, checkmark, trash } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button3Dtext } from '../global_components/PushableButtons'; 
import './StudentLoginAuth.css';

const PICTOGRAMS = [
  { id: 'perro', name: 'Perro', image: '/assets/pictograms/perro.png' },
  { id: 'gato', name: 'Gato', image: '/assets/pictograms/gato.png' },
  { id: 'tortuga', name: 'Tortuga', image: '/assets/pictograms/tortuga.png' },
  { id: 'león', name: 'León', image: '/assets/pictograms/león.png' },
  { id: 'elefante', name: 'Elefante', image: '/assets/pictograms/elefante.png' },
];

const REQUIRED_LENGTH = 3;
const MAX_LENGTH = REQUIRED_LENGTH;

export default function StudentLoginStep3() {
  const router = useIonRouter(); // Usamos router de Ionic para animaciones
  const params = useParams<{ groupId: string; username: string }>();
  const history = useHistory(); // Mantenemos history para leer location si es necesario
  const { login } = useAuth();

  // Obtener IDs de la URL de forma robusta
  const pathParts = history.location.pathname.split('/');
  const groupId = params.groupId || pathParts[pathParts.length - 2] || '';
  const username = params.username || pathParts[pathParts.length - 1] || '';

  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useIonViewWillEnter(() => {
    setSelected([]);
    setError('');
  });

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
      return [...prev, pictogramId];
    });
  };

  const removePictoAtIndex = (indexToRemove: number) => {
    setSelected(prev => prev.filter((_, index) => index !== indexToRemove));
    setError('');
  };

  // --- LÓGICA DE NAVEGACIÓN CORREGIDA ---
  const handleBack = () => {
    // En lugar de goBack(), forzamos ir a la vista de selección de alumnos de este grupo.
    // Usamos 'back' como dirección para que la animación sea correcta (deslizar izquierda a derecha).
    
    // NOTA: Asegúrate de tener la ruta "/student/login/step2/:groupId" definida en App.tsx
    // apuntando a StudentLoginUnified (o StudentLoginStep1) para que esto funcione.
    router.push(`/student/login/step2/${groupId}`, 'back');
  };

  const handleLogin = async () => {
    if (selected.length < REQUIRED_LENGTH) {
      setError('Aún faltan imágenes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const password = selected.join('-');
      await login({
        group_id: groupId,
        username: username,
        password: password
      });

      setSelected([]);
      router.push('/student/dashboard', 'forward'); // Animación hacia adelante al éxito
    } catch (err: any) {
      setError('Contraseña incorrecta, inténtalo de nuevo');
      setSelected([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="student-login-content">
        <div className="auth-login-container">
          
          {/* === HEADER === */}
          <div className="auth-header-row">
            
            {/* Botón Volver (Ahora usa handleBack) */}
            <Button3Dtext 
              color="var(--ion-color-primary)" 
              onClick={handleBack}
            >
               <IonIcon icon={arrowBack} className="btn-icon" />
            </Button3Dtext>

            {/* Título Central */}
                        <img 
              src="/assets/Tato/Tatitulo.png" 
              alt="Tato Matemáticas" 
              className="auth-logo-title" 
            />

            {/* Botón Confirmar */}
            <Button3Dtext 
              color="var(--ion-color-success)" 
              onClick={handleLogin}
              disabled={loading || selected.length !== REQUIRED_LENGTH}
            >
               <IonIcon icon={checkmark} className="btn-icon" />
            </Button3Dtext>
          </div>

          {/* Subtítulo / Instrucciones */}
          <div className="auth-instructions">
            <h2 className="auth-subtitle">
               Selecciona tu clave secreta ({REQUIRED_LENGTH} animales)
            </h2>
          </div>

          {/* === SECUENCIA SELECCIONADA === */}
          <div className="auth-sequence-row">
            <div className="auth-sequence-display">
              <div className="auth-sequence-slots">
                {Array.from({ length: REQUIRED_LENGTH }, (_, index) => {
                  const pictogramId = selected[index];
                  const picto = pictogramId ? PICTOGRAMS.find(p => p.id === pictogramId) : null;
                  
                  return (
                    <button
                      key={`slot-${index}`}
                      className={`auth-sequence-slot ${picto ? 'filled' : 'empty'}`}
                      onClick={() => picto && removePictoAtIndex(index)}
                      disabled={!picto}
                      aria-label={picto ? `Eliminar ${picto.name}` : `Posición ${index + 1} vacía`}
                    >
                      {picto ? (
                        <>
                          <img src={picto.image} alt={picto.name} className="auth-sequence-image" />
                          <div className="auth-slot-delete-overlay">
                            <IonIcon icon={trash} />
                          </div>
                        </>
                      ) : (
                        <span className="auth-sequence-placeholder-dot">?</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* === GRID DE PICTOGRAMAS === */}
          <div className="auth-pictograms-grid">
            {PICTOGRAMS.map((picto) => (
              <button
                key={picto.id}
                onClick={() => addPicto(picto.id)}
                disabled={loading || selected.length >= MAX_LENGTH}
                className="auth-pictogram-button"
              >
                <img
                  src={picto.image}
                  alt={picto.name}
                  className="auth-pictogram-image"
                />
              </button>
            ))}
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="auth-error-message">
              <span className="auth-error-icon">❌</span>
              <p>{error}</p>
            </div>
          )}

        </div>
      </IonContent>
    </IonPage>
  );
}