/**
 * Página principal del Dashboard de TatoMaths.
 * ------------------------------------------------------
 * Muestra la información del usuario autenticado (tutor o admin)
 * y ofrece accesos directos a las secciones correspondientes.
 *
 * Utiliza:
 * - **Ionic React** (`IonPage`, `IonHeader`, `IonContent`, etc.)
 * - **React Router** para redirección (`Redirect`, `useHistory`)
 * - **AuthContext** para obtener el estado de autenticación.
 */

import { IonPage, IonHeader, IonContent, IonButton, IonTitle, IonSpinner, IonToolbar } from '@ionic/react';
import { useHistory, Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


/**
 * Componente funcional del Dashboard.
 *
 * Muestra un panel personalizado según el tipo de usuario:
 * - **Tutor:** acceso a la gestión de alumnos.
 * - **Administrador:** acceso a la gestión de tutores y juegos.
 *
 * Incluye botón para cerrar sesión, y control de carga/autenticación.
 *
 * @returns {JSX.Element} Interfaz del panel principal para usuarios autenticados.
 *
 * @example
 * ```tsx
 * import Dashboard from "./pages/Dashboard";
 * 
 * <Route path="/dashboard" component={Dashboard} />
 * ```
 */
export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const history = useHistory();

  /**
   * Cierra la sesión del usuario y redirige a la página principal.
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

  // Redirigir si no hay usuario autenticado
  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dashboard - TatoMaths</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '600px', margin: '40px auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>
              ¡Hola, {user.full_name}!
            </h1>
            <p style={{ color: 'var(--ion-color-medium)', margin: 0 }}>
              {user.email}
            </p>
            <p style={{
              display: 'inline-block',
              padding: '4px 16px',
              marginTop: '12px',
              borderRadius: '16px',
              backgroundColor: user.role === 'admin' ? 'var(--ion-color-danger)' : 'var(--ion-color-primary)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {user.role === 'admin' ? 'ADMINISTRADOR' : 'TUTOR'}
            </p>
          </div>

          {user.role === 'tutor' && (
            <div style={{ marginBottom: '24px' }}>
              <IonButton expand="block" routerLink="/tutor/students" size="large">
                Ver mis alumnos
              </IonButton>
            </div>
          )}

          {user.role === 'admin' && (
            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <IonButton expand="block" routerLink="/admin/tutors" size="large">
                Gestionar tutores
              </IonButton>
              <IonButton expand="block" routerLink="/admin/games" size="large">
                Gestionar juegos
              </IonButton>
            </div>
          )}

          <IonButton
            expand="block"
            color="danger"
            onClick={handleLogout}
            size="large"
            style={{ marginTop: '40px' }}
          >
            Cerrar sesión
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
