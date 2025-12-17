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
import { UserDataWrapper } from './contexts/UserContext';
import { ManagerDataWrapper } from './contexts/ManagerContext';


// === Páginas principales ===
import Home from './pages/Home';

// === Routes ===
import { PrivateRoute, PublicRoute } from './routes/AppRoutes';

// === Páginas de autenticación ===
import Login from './pages/auth/Login';
import StudentRegister from './pages/auth/StudentRegister';
import StudentLogin from './pages/auth/StudentLogin';


// === Páginas de estudiante ===
import StudentDashboard from './pages/student/Dashboard';
import EditGame2 from './pages/student/EditGame2';

// === Juegos ===
import Game1 from './pages/games/Game1/Game1';
import Game2 from './pages/games/Game2/Game2';

// == Paginas de tutor ====

import TutorDashboard from './pages/teacherProfile/teacherDashboard';

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

// === Personalización alumno ===
import EditMenu from './pages/teacherProfile/EditStudent/EditMenu';
import EditColor from './pages/teacherProfile/EditStudent/EditColors';
import Prueba from './pages/teacherProfile/EditStudent/prueba';
import EditGame1 from './pages/student/EditGame1';
import EditGame34 from './pages/student/EditGame34';
import StudentEditProfile from './pages/teacherProfile/EditStudent/StudentEditProfile';
import EditColorsStudent from './pages/student/EditColorsStudent';
import EditNoiseStudent from './pages/student/EditNoiseStudent';
import EditText from './pages/teacherProfile/EditStudent/EditText';
import EditMessages from './pages/teacherProfile/EditStudent/EditMessages';


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
        <UserDataWrapper>
          <ManagerDataWrapper>
            <IonReactRouter>

              <IonRouterOutlet animated={false}>

                <PublicRoute path="/home" exact component={Home} />
                <PublicRoute path="/login" exact component={Login} />

                {/* Rutas del login de estudiante en 3 pasos */}
                <PublicRoute path="/student/login" exact component={StudentLogin} />
                {/* Ruta específica (Alumnos) - NECESARIA para que el botón 'Atrás' funcione */}
                <PublicRoute exact path="/student/login/step2/:groupId" component={StudentLogin} />

                {/* Game Routes */}
                <PrivateRoute path="/game/game1" allowedRoles={["student", "teacher"]}
                  exact component={Game1} />
                <PrivateRoute path="/game/game2" allowedRoles={["student", "teacher"]}
                  exact component={Game2} />

                {/* Users Routes (except admin) */}
                <PrivateRoute path="/student/dashboard" allowedRoles={["student"]}
                  exact component={StudentDashboard} />
                <PrivateRoute path="/student/profile" allowedRoles={["student"]}
                  exact component={StudentProfile} />
                <PrivateRoute path="/student/edit-game1/:id" allowedRoles={["student"]}
                  exact component={EditGame1} />
                <PrivateRoute path="/student-edit-game1/:id/:name" allowedRoles={["teacher"]}
                  exact component={EditGame1} />
                <PrivateRoute path="/student/edit-game2" allowedRoles={["student"]}
                  exact component={EditGame2} />
                <PrivateRoute path="/student-edit-game2/:id/:name" allowedRoles={["teacher"]}
                  exact component={EditGame2} />
                <PrivateRoute path="/student/edit-game34/:id" allowedRoles={["student"]}
                  exact component={EditGame34} />
                <PrivateRoute path="/student-edit-game34/:gameNumber/:id/:name" allowedRoles={["teacher"]}
                  exact component={EditGame34} />
                <PrivateRoute path="/student/edit-colors" allowedRoles={["student"]}
                  exact component={EditColorsStudent} />
                <PrivateRoute path="/student/edit-noise" allowedRoles={["student"]}
                  exact component={EditNoiseStudent} />
                <PrivateRoute path="/student-edit-noise/:id/:name" allowedRoles={["teacher"]}
                    exact component={EditNoiseStudent} />
                <PrivateRoute path="/teacher/dashboard" allowedRoles={["teacher"]}
                  exact component={TutorDashboard} />
                <PrivateRoute path="/teacher/profile" allowedRoles={["teacher"]}
                  exact component={TeacherProfilePage} />
                <PrivateRoute path="/teacher/edit-profile/:userId" allowedRoles={["admin"]}
                  exact component={TeacherEditProfile} />
                <PrivateRoute path="/teacheredit/profile" allowedRoles={["teacher"]}
                  exact component={TeacherEditProfile} />
                <PrivateRoute path="/teacher/register" allowedRoles={["admin"]}
                  exact component={TeacherRegister} />
                <PrivateRoute path="/admin/group/register" allowedRoles={["admin"]}
                  exact component={GroupRegister} />
                <PrivateRoute path="/admin/dashboard" allowedRoles={["admin"]}
                  exact component={AdminDashboard} />
                <PrivateRoute path="/student/register" allowedRoles={["admin"]}
                  exact component={StudentRegister} />
                <PrivateRoute path="/admin/dashboard/:tipo" allowedRoles={["admin"]}
                  exact component={userManagement} />
                <PrivateRoute path="/admin/dashboard/link-profiles" allowedRoles={["admin"]}
                  exact component={LinkProfiles} />
                <PrivateRoute path="/admin/dashboard/groups-management" allowedRoles={["admin"]}
                  exact component={GroupsManagement} />
                <PrivateRoute path="/admin/register-confirmation/:tipo" allowedRoles={["admin"]}
                  component={RegisterConfirmation} exact />
                <PrivateRoute path="/student-edit-menu/:id/:name" allowedRoles={["teacher"]}
                  exact component={EditMenu} />
                <PrivateRoute path="/student-edit-color/:id/:name" allowedRoles={["teacher"]}
                  exact component={EditColor} />
                <PrivateRoute path="/student-edit-text/:id/:name" allowedRoles={["teacher"]}
                  exact component={EditText} />
                <PrivateRoute path="/student-edit-messages/:id/:name" allowedRoles={["teacher"]}
                  exact component={EditMessages} />
                <PrivateRoute path="/prueba" allowedRoles={["teacher"]} exact component={Prueba} />
                <PrivateRoute path="/student-edit-profile/:id/:name" allowedRoles={["teacher"]}
                  exact component={StudentEditProfile} />

                {/* Redirección por defecto: ahora va a student-login en lugar de Home */}
                <Redirect to="/student/login" />
              </IonRouterOutlet>
            </IonReactRouter>
          </ManagerDataWrapper>
        </UserDataWrapper>
      </AuthProvider>
    </IonApp>
  );
}
