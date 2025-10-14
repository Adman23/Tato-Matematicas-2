import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
} from '@ionic/react';
import { logInOutline, arrowBackOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación frontend antes de enviar
    if (username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    setLoading(true);

    try {
      await login({ username, password });
      history.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);

      // Manejar diferentes tipos de errores
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;

        if (status === 404) {
          setError('El usuario no existe');
        } else if (status === 401) {
          setError('La contraseña es incorrecta');
        } else if (status === 422) {
          setError('El nombre de usuario debe tener al menos 3 caracteres');
        } else {
          setError(detail || 'Error al iniciar sesión');
        }
      } else {
        setError('Error de conexión. Verifica que el servidor esté activo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Iniciar Sesión - TatoMaths</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ maxWidth: '500px', margin: '40px auto' }}>
          <IonCard>
            <IonCardContent>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <IonIcon
                  icon={logInOutline}
                  style={{ fontSize: '64px', color: 'var(--ion-color-primary)' }}
                />
                <h2 style={{ margin: '16px 0 8px 0' }}>Tutor / Administrador</h2>
                <p style={{ color: 'var(--ion-color-medium)', margin: 0 }}>
                  Introduce tus credenciales
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <IonItem>
                  <IonLabel position="floating">Nombre de usuario</IonLabel>
                  <IonInput
                    type="text"
                    value={username}
                    onIonInput={(e) => setUsername(e.detail.value!)}
                    required
                    minlength={3}
                    autocomplete="username"
                    placeholder="Mínimo 3 caracteres"
                  />
                </IonItem>

                {username && username.length < 3 && (
                  <IonText color="warning">
                    <p style={{ padding: '4px 16px', margin: 0, fontSize: '12px' }}>
                      El nombre de usuario debe tener al menos 3 caracteres
                    </p>
                  </IonText>
                )}

                <IonItem style={{ marginTop: '12px' }}>
                  <IonLabel position="floating">Contraseña</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value!)}
                    required
                    autocomplete="current-password"
                  />
                </IonItem>

                {error && (
                  <IonText color="danger">
                    <p style={{ padding: '12px 16px', margin: 0, fontSize: '14px' }}>
                      {error}
                    </p>
                  </IonText>
                )}

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={loading || !username || username.length < 3 || !password}
                  style={{ marginTop: '24px' }}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </IonButton>
              </form>
            </IonCardContent>
          </IonCard>

          <IonButton
            expand="block"
            fill="clear"
            onClick={() => history.push('/')}
            style={{ marginTop: '16px' }}
          >
            <IonIcon icon={arrowBackOutline} slot="start" />
            Volver al inicio
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
