/**
 * Página principal del panel del estudiante (Student Dashboard).
 * ---------------------------------------------------------------
 * Muestra la interfaz principal para los estudiantes autenticados,
 * incluyendo su información, foto o inicial, y accesos a las secciones
 * de juego y progreso.
 *
 * Utiliza:
 * - **Ionic React** para la estructura y componentes visuales (`IonPage`, `IonCard`, `IonButton`, etc.).
 * - **React Router** para redirección (`Redirect`, `useHistory`).
 * - **AuthContext** (`useAuth`) para obtener el estado de autenticación del estudiante.
 */

import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  IonHeader,
  IonToolbar,
} from '@ionic/react';
import { Redirect, useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import SimpleHeaderUser from './components/SimpleHeaderUser';


/**
 * Componente funcional que representa el panel del estudiante.
 *
 * Permite al alumno autenticado:
 * - Ver su nombre y foto (o inicial si no tiene imagen).
 * - Acceder a las secciones de juegos y progreso.
 * - Cerrar sesión y volver a la página principal.
 *
 * Muestra un *spinner* mientras se carga el estado de autenticación
 * y redirige a `/student-login` si no hay sesión activa.
 *
 * @returns {JSX.Element} Interfaz del panel principal del estudiante.
 *
 * @example
 * ```tsx
 * import StudentDashboard from "./pages/student/Dashboard";
 *
 * <Route path="/student-dashboard" component={StudentDashboard} />
 * ```
 */
export default function StudentDashboard() {
  const { student, logout, loading } = useAuth();
  const history = useHistory();

  /**
   * Cierra la sesión del estudiante y redirige a la página de inicio.
   */
  const handleLogout = async () => {
    await logout();
    history.replace('/');
  };

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  // Redirigir si no hay estudiante autenticado
  if (!student) {
    return <Redirect to="/student-login" />;
  }

  return (
    <IonPage>

  <SimpleHeaderUser userName={"user"} />

      <IonContent className="student-login-content">
        <div className="student-login-container">



          {/* Título */}
          <div className="student-login-header">
            <h1 className="student-login-title">
              ¡Hola, {student.username || student.name}!
            </h1>
            <p className="student-login-subtitle">
              Bienvenido a TatoMaths
            </p>
          </div>

          {/* Contenido del dashboard - TODO: Agregar secciones de juegos, progreso, etc. */}
          <div className="student-dashboard-content">
            <p>Dashboard en construcción...</p>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
}
