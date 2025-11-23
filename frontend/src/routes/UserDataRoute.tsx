/**
 * !! NEW FILE
 *  -> To use in app.tsx
 *  -> Allows the usage of UserDataWrapper under AuthProvider
 * 
 * !! EDITED
 *  -> Now it extends from private route so it has protection too
 * 
 * @brief Allows react components
 */


import React, { useMemo } from 'react';
import type { RouteProps } from 'react-router-dom';
import { UserDataWrapper } from '../contexts/UserContext';
import { PrivateRoute } from './AppRoutes'
import type { Role } from '../lib/api';

/**
 * Interface
 * @brief Extends RouteProps to recieve a context wrapper
 */
interface UserDataRouteProps extends RouteProps {
    component: React.ComponentType<any>;
    allowedRoles?: Role[];
}


/**
 * UserDataRoute
 * ------------------
 * Personalized route that allows the usual PrivateRoute to have the UserDataContex inside it
 * and the wrapper will render the react component (the page).
 * @param rest the other arguments, like the path and all of that.
 */
export const UserDataRoute: React.FC<UserDataRouteProps> = ({ component: Component, allowedRoles, ...rest }) => {
    
    const ContextWrappedComponent = useMemo(() => {
        return (props: any) => (
            <UserDataWrapper>
                <Component {...props} />
            </UserDataWrapper>
        );
    }, [Component]);

    return (
        <PrivateRoute 
            {...rest}
            allowedRoles={allowedRoles} 
            component={ContextWrappedComponent} 
        />
    );
};
