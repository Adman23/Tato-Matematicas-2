import { IonApp, IonRouterOutlet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

// Auth
import Login from './pages/auth/Login';
import StudentLogin from './pages/auth/StudentLogin';

// Student
import StudentDashboard from './pages/student/Dashboard';

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
            <Redirect to="/" />
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
}
