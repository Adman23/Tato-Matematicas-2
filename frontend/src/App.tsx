/**
 * Punto de entrada principal de la aplicación TatoMaths (Frontend).
 * ------------------------------------------------------------------
 * Configura la estructura general de la aplicación utilizando:
 *
 * - **Ionic React** (`IonApp`, `IonRouterOutlet`, `IonReactRouter`) para la interfaz.
 * - **React Router** para la navegación entre páginas.
 * - **AuthProvider** para proveer el contexto global de autenticación.
 *
 * Todas las rutas principales se definen aquí.
 */

import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// === Páginas principales ===
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

// === Páginas de autenticación ===
import Login from './pages/auth/Login';
import StudentLoginStep1 from './pages/auth/StudentLoginStep1';
import StudentLoginStep2 from './pages/auth/StudentLoginStep2';
import StudentLoginStep3 from './pages/auth/StudentLoginStep3';

// === Páginas de estudiante ===
import StudentDashboard from './pages/student/Dashboard';

// === Páginas de admin ===
import LinkProfiles from './pages/admin/LinkProfiles';
import AdminDashboard from './pages/admin/MenuAdmin';
import userManagement from './pages/admin/userManagement';


/**
 * Componente raíz de la aplicación.
 *
 * Este componente:
 * - Inicializa la aplicación de Ionic.
 * - Configura las rutas principales con `IonReactRouter`.
 * - Envuelve toda la aplicación con el `AuthProvider` para compartir el estado de autenticación.
 *
 * @returns {JSX.Element} Estructura principal de la aplicación TatoMaths.
 *
 * @example
 * ```tsx
 * import React from "react";
 * import ReactDOM from "react-dom";
 * import App from "./App";
 *
 * ReactDOM.render(<App />, document.getElementById("root"));
 * ```
 */
export default function App() {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route path="/" exact component={Home} />
            <Route path="/login" exact component={Login} />

            {/* Rutas del login de estudiante en 3 pasos */}
            <Route path="/student-login" exact component={StudentLoginStep1} />
            <Route path="/student-login/step2/:groupId" exact component={StudentLoginStep2} />
            <Route path="/student-login/step3/:groupId/:username" exact component={StudentLoginStep3} />

            <Route path="/dashboard" exact component={Dashboard} />
            <Route path="/student-dashboard" exact component={StudentDashboard} />

            <Route path="/admin/link-profiles" exact component={LinkProfiles} />
            <Route path="/admin" exact component={AdminDashboard} />
            <Route path="/admin/:tipo" exact component={userManagement} />
            <Redirect to="/" />
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
}
