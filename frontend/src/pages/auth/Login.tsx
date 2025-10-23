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
import { eyeOutline, eyeOffOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
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

  const isUsernameValid = username.trim().length > 0;

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="outer-center-container">
          <h1 className="main-title">Tato Matemáticas 2</h1>
          <IonCard className="login-card">
            <IonCardContent>
              <div className='main-container'>
                <h2 className="login-heading">Inicio de sesión</h2>
                <p className="login-subheading">Ingrese sus datos, por favor</p>
                <form onSubmit={handleLogin} className="login-form">
                  <IonItem lines="none" className="input-item">
                    <IonLabel position="stacked">Usuario</IonLabel>
                    <IonInput
                      type="text"
                      value={username}
                      onIonInput={(e) => setUsername(e.detail.value!)}
                      required
                      autocomplete="username"
                      placeholder="Escriba aquí"
                    >
                      <IonIcon
                        icon={isUsernameValid ? checkmarkOutline : closeOutline}
                        slot='end'
                        className="input-icon"
                      />
                    </IonInput>
                  </IonItem>

                  <div className="spacer"></div>

                  <IonItem lines="none" className="input-item">
                    <IonLabel position="stacked">Contraseña</IonLabel>
                    <IonInput
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onIonInput={(e) => setPassword(e.detail.value!)}
                      required
                      autocomplete="current-password"
                    >
                      <IonIcon
                        icon={showPassword ? eyeOffOutline : eyeOutline}
                        onClick={togglePasswordVisibility}
                        slot='end'
                        className="input-icon"
                        style={{ cursor: 'pointer' }}
                      />
                    </IonInput>
                  </IonItem>

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
        </div>
      </IonContent>
    </IonPage >
  );
}
