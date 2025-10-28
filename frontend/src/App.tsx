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
import Login from './pages/auth/TutorLogin';
import StudentLogin from './pages/auth/StudentLogin';
import RegisterTutor from './pages/auth/RegisterTutor';

// === Páginas de estudiante ===
import StudentDashboard from './pages/student/Dashboard';


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
            <Route path="/student-login" exact component={StudentLogin} />
            <Route path="/dashboard" exact component={Dashboard} />
            <Route path="/student-dashboard" exact component={StudentDashboard} />
            {/* Nueva ruta de registro de tutores */}
            <Route path="/register-tutor" exact component={RegisterTutor} />
            <Redirect to="/" />
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
}
