/**
 * Página de inicio de sesión para tutores y administradores.
 * -----------------------------------------------------------
 * Permite a los usuarios autenticarse mediante nombre de usuario y contraseña.
 *
 * Utiliza:
 * - **Ionic React** para la interfaz (`IonInput`, `IonButton`, `IonCard`, etc.).
 * - **React Hooks** (`useState`) para gestionar el estado del formulario.
 * - **React Router** (`useHistory`) para redirecciones.
 * - **AuthContext** (`useAuth`) para conectarse con la API de autenticación.
 */

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
  IonToast,
} from '@ionic/react';
import { arrowBackOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import './Login.css';


/**
* Componente funcional de la pantalla de inicio de sesión.
*
* Permite al tutor o administrador autenticarse ingresando su nombre de usuario
* y contraseña. Realiza validaciones básicas en frontend y muestra errores en caso
* de credenciales inválidas o problemas de conexión.
*
* @returns {JSX.Element} Interfaz del formulario de inicio de sesión.
*
* @example
* ```tsx
* import Login from "./pages/auth/Login";
*
* <Route path="/login" component={Login} />
* ```
*/
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'danger' | 'success'>('danger');

  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const history = useHistory();

  /**
 * Maneja el envío del formulario de inicio de sesión.
 *
 * Valida el nombre de usuario antes de enviar la solicitud al backend.
 * En caso de éxito, redirige al dashboard correspondiente al rol.
 *
 * @param {React.FormEvent} e - Evento del formulario.
 */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('');
    setLoading(true);

    let current_error = '';

    try {
      await login({ username, password });
      history.push('/dashboard');
    } catch (err: any) {

      // Manejar diferentes tipos de errores
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;

        if (status === 404) {
          current_error = ' El usuario es incorrecto ';
        } else if (status === 401) {
          current_error = ' La contraseña es incorrecta ';
        } else if (status === 422) {
          current_error = 'El usuario o la contraseña son incorrectos '
        }
        else {
          current_error = detail || ' Error al iniciar sesión ';
        }
      } else {
        current_error = (' Error de conexión. Verifica que el servidor esté activo. ');
      }
      console.error('Login error:', current_error);

      // Mostramos el toast con el error
      setToastMessage(current_error);
      setToastColor('danger');
      setShowToast(true);

    } finally {
      setLoading(false);
    }
  };

  /**
* Alterna la visibilidad de la contraseña.
*/
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{
                margin: '16px 0 8px 0',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-normal)'
              }}>Tato Matemáticas 2</h1>
            </div>
            <div style={{
              backgroundColor: 'var(--ion-color-primary)',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '300px',
              margin: '40px auto',
              textAlign: 'center',
              color: 'white',
              position: 'relative'
            }}>
              <h2 style={{
                marginBottom: '4px',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-normal)'
              }}>Inicio de sesión</h2>
              <p style={{
                marginBottom: '24px',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-normal)',
                color: 'black'
              }}
              >Ingrese sus datos, por favor</p>
              <form onSubmit={handleLogin}>
                <div style={{ textAlign: 'left', marginBottom: '30px', color: 'black' }}>
                  <IonItem>
                    <IonLabel position="floating">Usuario</IonLabel>
                    <IonInput
                      className='rounded-input'
                      type="text"
                      value={username}
                      onIonInput={(e) => setUsername(e.detail.value!)}
                      required
                      autocomplete="email"
                      placeholder="Escriba aquí"
                    />
                  </IonItem>

                  <div style={{ height: '20px' }}></div>

                  <IonItem>
                    <IonLabel position="floating">Contraseña</IonLabel>
                    <IonInput
                      className='rounded-input'
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onIonInput={(e) => setPassword(e.detail.value!)}
                      required
                      autocomplete="current-password"
                    >
                      <IonIcon
                        icon={showPassword ? eyeOffOutline : eyeOutline}
                        slot='end'
                        onClick={togglePasswordVisibility}
                        style={{ cursor: 'pointer' }}
                      />
                    </IonInput>
                  </IonItem>
                </div>

                <IonButton
                  expand="block"
                  type="submit"
                  className='rounded-button'
                >
                  {loading ? 'Accediendo...' : 'Acceder'}
                </IonButton>
                <IonButton
                  className='rounded-button'
                  expand="block"
                  fill="clear"
                  onClick={() => history.push('/')}
                >
                  Volver al inicio
                </IonButton>
                <IonToast
                  isOpen={showToast}
                  onDidDismiss={() => setShowToast(false)}
                  message={toastMessage}
                  duration={2000}
                  color={toastColor}
                  position="bottom"
                  cssClass={'custom-form-toast'}
                />
              </form>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage >
  );
}
