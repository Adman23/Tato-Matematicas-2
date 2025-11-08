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
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonToast,
} from '@ionic/react';
import { eyeOutline, eyeOffOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../lib/api';
import { setupIonicReact } from '@ionic/react';

import './Login.css';

setupIonicReact();

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
   * Reset del formulario de inicio de sesión.
   * Reinicia los campos `username` y `password` a strings vacíos.
   * @returns {void}
   */
  const clearForm = () => {
    setUsername('');
    setPassword('');
  };
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
      //En si la funcion no devolvia role, asi qeu lo cojo de localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      clearForm();
      if (userData.role === 'admin') {
        history.push('/admin-dashboard');
      } else if (userData.role === 'teacher') {
        history.push('/tutor-dashboard');
      };
    } catch (err: any) {

      // Manejar diferentes tipos de errores
      if (err.response) {
        const status = err.response.status;
        const detail = err.response.data?.detail;

        if (status === 404) {
          current_error = ' El usuario es incorrecto ';
        } else if (status === 401) {
          current_error = ' La contraseña es incorrecta ';
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
   * Alterna la visibilidad del campo de contraseña.
   * Cambia el estado `showPassword` (boolean).
   * @returns {void}
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Estado para existencia del username: null = desconocido/vacío, true = existe, false = no existe
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null);
  const requestIdRef = useRef(0);

  /**
   * Efecto para validar la existencia del nombre de usuario mientras el usuario escribe.
   * - Aplica debounce (400ms) antes de llamar a `authAPI.checkUsername`.
   * - Usa `requestIdRef` para ignorar respuestas obsoletas y evitar condiciones de carrera.
   * - Actualiza `isUsernameValid` con `true` o `false` según la respuesta.
   */
  useEffect(() => {
    const trimmed = username.trim();

    // Resetear si campo vacío
    if (trimmed.length === 0) {
      setIsUsernameValid(false);
      return;
    }

    // Validación rápida local: evitar peticiones para nombres muy cortos
    if (trimmed.length < 3) {
      setIsUsernameValid(false);
      return;
    }

    const currentId = ++requestIdRef.current;

    const handler = setTimeout(() => {
      authAPI.checkUsername(trimmed)
        .then(res => {
          if (currentId === requestIdRef.current) {
            setIsUsernameValid(Boolean(res.exists));
          }
        })
        .catch(() => {
          if (currentId === requestIdRef.current) {
            // En caso de error de red, dejamos como inválido para no dar falsas esperanzas
            setIsUsernameValid(false);
          }
        })
    }, 400); // debounce

    return () => clearTimeout(handler);
  }, [username]);

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding login-background">

        <div className="login-container">
          <div className="main-title">
            <IonText>
              <h1>Tato Matemáticas 2</h1>
            </IonText>
          </div>

          <div className="login-card">
            <IonText>
              <h2> Inicio de sesión</h2>
              <p>Ingrese sus datos, por favor</p>
            </IonText>

            <form onSubmit={handleLogin} className="login-form">
              <IonItem lines="none" className="input-item">
                <IonLabel position="stacked">Usuario</IonLabel>
                <IonInput
                  className='login-custom-input'
                  type="text"
                  value={username}
                  onIonInput={(e) => setUsername(e.detail.value!)}
                  required
                  autocomplete="username"
                  placeholder="Escriba aquí"
                />

                <IonIcon
                  icon={isUsernameValid ? checkmarkOutline : closeOutline}
                  slot='end'
                  className="input-icon"
                />

              </IonItem>

              <IonItem lines="none" className="input-item">
                <IonLabel position="stacked">Contraseña</IonLabel>
                <IonInput
                  className='login-custom-input'
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
                  required
                  autocomplete="current-password"
                />
                <IonIcon
                  icon={showPassword ? eyeOffOutline : eyeOutline}
                  onClick={togglePasswordVisibility}
                  slot='end'
                  className="input-icon"
                  style={{ cursor: 'pointer' }}
                />
              </IonItem>

              <IonButton
                expand="block"
                type="submit"
                className='login-button'
              >
                {loading ? 'Accediendo...' : 'Acceder'}
              </IonButton>

              <IonButton
                className='login-button'
                expand="block"
                fill="clear"
                onClick={() => {
                  clearForm();
                  history.push('/');
                }}
              >
                Volver al inicio
              </IonButton>
              <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={2000}
                color={toastColor}
                position="top"
                cssClass={'custom-form-toast'}
              />
            </form>
          </div >
        </div >
      </IonContent >
    </IonPage >
  );
}