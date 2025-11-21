/**
 * Resumen Funcional.
 *
 * Página de inicio de sesión para tutores y administradores. Renderiza un
 * formulario que solicita 'username' y 'password', valida la existencia del
 * usuario mientras se escribe, realiza la autenticación y redirige según el
 * rol del usuario.
 *
 * Flujo de ejecución.
 *
 * 1. Renderiza los campos de entrada y botones.
 * 2. Mientras el usuario escribe en 'Usuario', se aplica un debounce y se
 *    solicita a `authAPI.checkUsername` la existencia del nombre. Se muestra
 *    un icono indicando si el usuario existe o no.
 * 3. Al enviar el formulario (`handleLogin`):
 *    - Se llama a `login` del contexto de autenticación.
 *    - Si la autenticación es correcta, se obtiene el rol desde
 *      `localStorage` y se redirige a `/admin-dashboard` o `/tutor-dashboard`.
 *    - Si hay un error, se muestra un `IonToast` con el mensaje correspondiente.
 *
 * @param {void} No recibe props; utiliza hooks y contexto.
 * @returns {JSX.Element} Componente de la pantalla de login.
 *
 * @example Ejemplo de uso
 *
 * ```tsx
 * import Login from './pages/auth/Login';
 * <Route path="/login" component={Login} />
 * ```
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
  IonSpinner,
} from '@ionic/react';
import { eyeOutline, eyeOffOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../lib/api';
import { setupIonicReact } from '@ionic/react';

import './Login.css';

setupIonicReact();

/**
 * Resumen Funcional.
 *
 * Componente de la pantalla de inicio de sesión. Gestiona el formulario de
 * autenticación, validación en tiempo real del nombre de usuario y muestra
 * retroalimentación (toasts) en caso de error.
 *
 * Flujo de ejecución.
 *
 * - Usuario introduce 'username' y 'password'.
 * - Mientras escribe 'username', se realiza una comprobación debounce para
 *   verificar existencia mediante `authAPI.checkUsername`.
 * - Al enviar el formulario, `handleLogin` llama a `login` del contexto y
 *   redirige según el rol almacenado en `localStorage`.
 *
 * @param {void} No recibe props; usa hooks y contexto.
 * @returns {JSX.Element} Elemento JSX que representa la pantalla de login.
 *
 * @example Ejemplo de uso
 *
 * ```tsx
 * import Login from './pages/auth/Login';
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

  const { user, loadingAuth, login } = useAuth();
  const history = useHistory();


  // Show loading icon
  if (loadingAuth) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  // Redirigir si hay estudiante autenticado
  if (user) {
    console.log("Redirect to login because there is a user");
    if (user.role === "student")
      return <Redirect to="/student-dashboard" />;
    else
    if (user.role === "admin")
      return <Redirect to="/admin-dashboard" />;
    else
    if (user.role === "teacher")
      return <Redirect to="/tutor-dashboard" />;
  }

  /**
   * Resumen Funcional.
   *
   * Resetea el formulario de inicio de sesión.
   *
   * Flujo de ejecución.
   *
   * - Se invoca tras un inicio de sesión exitoso o cuando el usuario pulsa
   *   "Volver al inicio".
   * - Limpia los estados locales `username` y `password` para dejar el
   *   formulario en su estado inicial.
   *
   * @param {void}
   * @returns {void}
   *
   * @example
   * ```ts
   * clearForm();
   * ```
   */
  const clearForm = () => {
    setUsername('');
    setPassword('');
  };
  /**
   * Resumen Funcional.
   *
   * Procesa el envío del formulario de autenticación. Llama a la función
   * `login` del contexto de autenticación y gestiona redirecciones y errores.
   *
   * Flujo de ejecución.
   *
   * - Previene el comportamiento por defecto del formulario.
   * - Limpia mensajes previos y activa el estado de carga.
   * - Llama a `login({ username, password })`.
   * - Si la respuesta es exitosa: extrae el rol desde `localStorage`, limpia
   *   el formulario y redirige a la ruta correspondiente.
   * - Si hay error: construye un mensaje adecuado (según status) y muestra
   *   un `IonToast` con color 'danger'.
   *
   * @param {React.FormEvent} e - Evento de envío del formulario.
   * @returns {Promise<void>} Promesa que resuelve cuando termina la operación.
   *
   * @example
   * ```tsx
   * <form onSubmit={handleLogin}>...</form>
   * ```
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
   * Resumen Funcional.
   *
   * Alterna la visibilidad del campo de contraseña (`password`).
   *
   * Flujo de ejecución.
   *
   * - Invierte el valor booleano de `showPassword`.
   * - Este estado controla el tipo del `IonInput` ("text" | "password").
   *
   * @param {void}
   * @returns {void}
   *
   * @example
   * ```tsx
   * <IonIcon onClick={togglePasswordVisibility} />
   * ```
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Estado para existencia del username: null = desconocido/vacío, true = existe, false = no existe
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null);
  const requestIdRef = useRef(0);

  /**
   * Resumen Funcional.
   *
   * Valida de forma asíncrona la existencia del nombre de usuario mientras el
   * usuario escribe, evitando llamadas innecesarias mediante debounce y
   * previniendo condiciones de carrera con `requestIdRef`.
   *
   * Flujo de ejecución.
   *
   * - Se ejecuta cada vez que cambia `username`.
   * - Si el campo está vacío o demasiado corto, marca como inválido sin pedir al
   *   servidor.
   * - Tras 400ms sin cambios, llama a `authAPI.checkUsername(trimmed)`.
   * - Solo la respuesta con `currentId === requestIdRef.current` actualiza el estado
   *   `isUsernameValid`.
   *
   * @param {void} (usa `username` desde el cierre lexical)
   * @returns {void}
   *
   * @example
   * ```ts
   * // El efecto se ejecuta automáticamente; no se llama manualmente.
   * ```
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
                  history.push('/home');
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