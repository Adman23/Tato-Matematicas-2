/**
 * Functional summary.
 *
 * Login page for tutors and administrators. Renders a form requesting 'username' and 'password', 
 * validates the existence of the user while typing, performs authentication, and redirects based on the user's role.
 *
 * Execution flow.
 *
 * 1. Renders input fields and buttons.
 * 2. While the user types in 'Username', a debounce is applied and
 *    requests `authAPI.checkUsername` to verify the existence of the username. An icon is displayed indicating whether the user exists or not.
 * 3. Upon form submission (`handleLogin`):
 *    - Calls `login` from the authentication context.
 *    - If authentication is successful, retrieves the role from
 *      `localStorage` and redirects to `/admin-dashboard` or `/tutor-dashboard`.
 *    - If there is an error, displays an `IonToast` with the corresponding message.
 *
 * @param {void} Does not receive props; uses hooks and context.
 * @returns {JSX.Element} Login screen component.
 *
 * @example Example of usage
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
 * Functional summary.
 *
 * Login screen component. Manages the authentication form, real-time username validation, and displays feedback (toasts) in case of errors.
 *
 * Execution flow.
 *
 * - User enters 'username' and 'password'.
 * - While typing 'username', a debounce check is performed to
 *   verify existence using `authAPI.checkUsername`.
 * - Upon form submission, `handleLogin` calls `login` from the context and
 *   redirects based on the role stored in `localStorage`.
 *
 * @param {void} Does not receive props; uses hooks and context.
 * @returns {JSX.Element} JSX element representing the login screen.
 *
 * @example Example of usage
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

  const { login } = useAuth();
  const history = useHistory();


  /*
  !! DEPRECATED
    -> Now redirection happens in /routes/RouteController.tsx

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
      return <Redirect to="/student/dashboard" />;
    else
    if (user.role === "admin")
      return <Redirect to="/admin-dashboard" />;
    else
    if (user.role === "teacher")
      return <Redirect to="/teacher/dashboard" />;
  }
  */

  /**
   * Functional summary.
   *
   * Resets the login form.
   *
   * Execution flow.
   *
   * - It is invoked after a successful login or when the user clicks
   *   "Return to home".
   * - Clears the local states `username` and `password` to reset the
   *   form to its initial state.
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
   * Functional summary.
   *
   * Processes the submission of the authentication form. Calls the `login` function
   * from the authentication context and manages redirections and errors.
   *
   * Execution flow.
   *
   * - Prevents the default form submission behavior.
   * - Clears previous messages and sets loading state.
   * - Calls `login({ username, password })`.
   * - If the response is successful: extracts the role from `localStorage`, clears
   *   the form, and redirects to the corresponding route.
   * - If there is an error: constructs an appropriate message (based on status) and displays
   *   an `IonToast` with color 'danger'.
   *
   * @param {React.FormEvent} e - Form submission event.
   * @returns {Promise<void>} Promise that resolves when the operation completes.
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
      // The function did not return the role, so I get it from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      clearForm();
      if (userData.role === 'admin') {
        history.push('/admin/dashboard');
      } else if (userData.role === 'teacher') {
        history.push('/teacher/dashboard');
      };
    } catch (err: any) {

      // Handle different types of errors
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

      // Show the toast with the error
      setToastMessage(current_error);
      setToastColor('danger');
      setShowToast(true);

    } finally {
      setLoading(false);
    }
  };

  /**
   * Functional summary.
   *
   * Toggles the visibility of the password field (`password`).
   *
   * Execution flow.
   *
   * - Inverts the boolean value of `showPassword`.
   * - This state controls the type of the `IonInput` ("text" | "password").
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

  // State for username existence: null = unknown/empty, true = exists, false = does not exist
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null);
  const requestIdRef = useRef(0);

  /**
   * Functional summary.
   *
   * Asynchronously validates the existence of the username while the
   * user types, avoiding unnecessary calls through debounce and
   * preventing race conditions with `requestIdRef`.
   *
   * Execution flow.
   *
   * - Executes every time `username` changes.
   * - If the field is empty or too short, marks as invalid without asking the
   *   server.
   * - After 400ms without changes, calls `authAPI.checkUsername(trimmed)`.
   * - Only the response with `currentId === requestIdRef.current` updates the state
   *   `isUsernameValid`.
   *
   * @param {void} (uses `username` from lexical closure)
   * @returns {void}
   *
   * @example
   * ```ts
   * // The effect runs automatically; it is not called manually.
   * ```
   */
  useEffect(() => {
    const trimmed = username.trim();

    // Reset if field is empty
    if (trimmed.length === 0) {
      setIsUsernameValid(false);
      return;
    }

    // Quick local validation: avoid requests for very short names
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
            // In case of network error, leave as invalid to avoid false hopes
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
                  history.push('/student/login');
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