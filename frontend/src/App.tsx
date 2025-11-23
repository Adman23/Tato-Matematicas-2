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
import { Redirect } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';


// === Páginas principales ===
import Home from './pages/Home';

// === Routes ===
import { UserDataRoute } from './routes/UserDataRoute';
import { PrivateRoute, PublicRoute} from './routes/AppRoutes';

// === Páginas de autenticación ===
import Login from './pages/auth/Login';
import StudentRegister from './pages/auth/StudentRegister';
import StudentLoginStep1 from './pages/auth/StudentLoginStep1';
import StudentLoginStep2 from './pages/auth/StudentLoginStep2';
import StudentLoginStep3 from './pages/auth/StudentLoginStep3';

// === Páginas de estudiante ===
import StudentDashboard from './pages/student/Dashboard';

// === Juegos ===
import Game1 from './pages/games/Game1/Game1';
import Game2 from './pages/games/Game2/Game2';

// == Paginas de tutor ====

import TutorDashboard from './pages/tutor/Dashboard';

// === Páginas de admin ===
import LinkProfiles from './pages/admin/LinkProfiles';
import AdminDashboard from './pages/admin/MenuAdmin';
import userManagement from './pages/admin/userManagement';
import GroupsManagement from './pages/admin/GroupsManagement';
import GroupRegister from './pages/admin/GroupRegister';

// === Perfil profesor ===
import TeacherProfilePage from './pages/teacherProfile/teacherProfilePage';
import TeacherEditProfile from './pages/teacherProfile/teacherEditProfile';

import TeacherRegister from './pages/auth/TeacherRegister';
import RegisterConfirmation from './pages/auth/RegisterConfirmation';
import StudentProfile from './pages/student/StudentProfile';

import EditMenu from './pages/teacherProfile/EditStudent/EditMenu';
import EditColor from './pages/teacherProfile/EditStudent/EditColors';
import Prueba from './pages/teacherProfile/EditStudent/prueba';


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

            <PublicRoute path="/home" exact component={Home} />
            <PublicRoute path="/login" exact component={Login} />

            {/* Rutas del login de estudiante en 3 pasos */}
            <PublicRoute path="/student/login" exact component={StudentLoginStep1} />
            <PublicRoute path="/student/login/step2/:groupId" exact component={StudentLoginStep2} />
            <PublicRoute path="/student/login/step3/:groupId/:username" exact component={StudentLoginStep3} />

            {/* Game Routes */}
            <UserDataRoute path="/game/game1" allowedRoles={["student", "teacher"]}
              exact component={Game1} />
            <UserDataRoute path="/game/game2" allowedRoles={["student", "teacher"]}
              exact component={Game2} />

            {/* Users Routes (except admin) */}
            <UserDataRoute path="/student/dashboard" allowedRoles={["student"]}  
              exact component={StudentDashboard} />
            <UserDataRoute path="/student/profile" allowedRoles={["student"]} 
              exact component={StudentProfile} />
            <UserDataRoute path="/teacher/dashboard" allowedRoles={["teacher"]} 
              exact component={TutorDashboard} />
            <UserDataRoute path="/teacher/profile" allowedRoles={["teacher"]} 
              exact component={TeacherProfilePage} />
            <UserDataRoute path="/teacheredit/profile" allowedRoles={["teacher"]} 
              exact component={TeacherEditProfile} />


            <PrivateRoute path="/teacher/register" allowedRoles={["teacher"]} 
              exact component={TeacherRegister} />
            <PrivateRoute path="/admin/group/register" allowedRoles={["admin"]} 
              exact component={GroupRegister} />
            <PrivateRoute path="/admin/dashboard" allowedRoles={["admin"]}
              exact component={AdminDashboard} />
            <PrivateRoute path="/student/register" allowedRoles={["student"]}
              exact component={StudentRegister} />
            <PrivateRoute path="/admin/dashboard/:tipo" allowedRoles={["admin"]}
              exact component={userManagement} />
            <PrivateRoute path="/admin/dashboard/link-profiles" allowedRoles={["admin"]}
              exact component={LinkProfiles} />
            <PrivateRoute path="/admin/dashboard/groups-management" allowedRoles={["admin"]}
              exact component={GroupsManagement} />
            <PrivateRoute path="/admin/register-confirmation/:tipo" allowedRoles={["admin"]}
              component={RegisterConfirmation} exact />
            <Route path="/student-edit-menu/:id/:name" exact component={EditMenu} />
            <Route path="/student-edit-color/:id/:name" exact component={EditColor} />
            <Route path="/prueba" exact component={Prueba} />
            {/* Redirección por defecto: ahora va a student-login en lugar de Home */}
            <Redirect to="/student/login" />
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
}
