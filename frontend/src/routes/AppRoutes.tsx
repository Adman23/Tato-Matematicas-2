/**
 * !! NEW 
 *  -> Route file defining the two main types of routes
 *  -> If any other route is defined (like UserDataRoute)
 *  -> it should extend from one of these to maintain security and reuse code.
 */

import React, { useEffect } from 'react';
import { Route } from 'react-router-dom';
import type { RouteProps } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../lib/api.ts';
import { useIonRouter } from '@ionic/react';

// Dashboard for each role
const ROLE_DASHBOARDS = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    admin:   '/admin/dashboard'
};

interface CustomRouteProps extends RouteProps {
  component: React.ComponentType<any>; // A React component
  allowedRoles?: Role[];               // Optional: Defines the allowed roles for private routes
}



/**
 * @brief Simple component to substitute Redirect from react and resolve problems
 */
const IonicRedirect: React.FC<{ to: string }> = ({ to }) => {
    const router = useIonRouter();

    useEffect(() => {
        // More effective and less errors than a simple redirect
        router.push(to, 'root', 'replace');
    }, [to, router]);

    return null; // Doesnt render anything
};


/**
 * @brief Used for the basic routes, like home and login
 *        C1: If a user is logged in  -> Redirects to dashboard
 *        C2: If no user is logged in -> Shows the page
 * 
 * @param component the react component this applies to
 * @param rest mostly the "path"
 * @returns A redirection or the exact component it was applied to
 */
export const PublicRoute: React.FC<CustomRouteProps> = ({ component: Component, ...rest }) => {
    const { user, loadingAuth } = useAuth();

    return (
        <Route
        {...rest}
        render={(props) => {
            if (loadingAuth) return null;

            if (user) {
                // C1: Logged in
                const userRole = user.role as Role;
                return <IonicRedirect to={ROLE_DASHBOARDS[userRole]} />;
            }

            // C2: Not logged in
            return <Component {...props} />;
        }}
    />
    );
};



/**
 * @brief Used for all the other routes
 *        C1: If a user is logged in and its allowed -> show the component
 *        C2: If a user is logged in but the page isnt allowed -> redirect to dashboard
 *        C3: If no user is logged in -> redirect to login
 * 
 * @param component the react component this applies to
 * @param allowedRoles array of "Role" to give security
 * @param rest mostly the "path"
 * @returns A redirection or the exact component it was applied to
 */
export const PrivateRoute: React.FC<CustomRouteProps> = ({ component: Component, allowedRoles, ...rest }) => {
    const { user, loadingAuth } = useAuth();

    return (
        <Route
        {...rest}
        render={(props) => {
            if (loadingAuth) return null;

            const currentPath = props.location.pathname;
            
            if (!user) {
                // Evade loop
                if (currentPath === '/student/login') return <Component {...props} />;
                // C3: There is no session
                return <IonicRedirect to="/student/login" />;
            }
            const userRole = user.role as Role;
            
            if (allowedRoles && !allowedRoles.includes(userRole)) {
                /*
                console.error(`ERROR CRÍTICO: El usuario tiene rol '${userRole}' pero no está autorizado en '${currentPath}'. Posible error de mayúsculas.`);
                // Break loop
                return (
                    <div style={{ padding: 20, textAlign: 'center' }}>
                        <h2>Acceso Denegado</h2>
                        <p>Tu rol ({userRole}) no tiene permisos para estar aquí, aunque sea tu inicio.</p>
                        <p>Contacta al soporte o cierra sesión.</p>
                    </div>
                );
                */
                // C2: User is logged, but now allowed
                return <IonicRedirect to={ROLE_DASHBOARDS[userRole]} />;
            }

            // C1: User is logged and allowed
            return <Component {...props} />;
        }}
        />
    );
};