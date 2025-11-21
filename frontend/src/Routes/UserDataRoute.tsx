/**
 * !! NEW FILE
 *  -> To use in app.tsx
 *  -> Allows the usage of UserDataWrapper under AuthProvider
 * 
 * @brief Allows react components
 */


import React from 'react';
import { Route } from 'react-router-dom';
import type { RouteProps } from 'react-router-dom';
import { UserDataWrapper } from '../contexts/UserContext';

/**
 * Interface
 * @brief Extends RouteProps to recieve a context wrapper
 */
interface UserDataRouteProps extends RouteProps {
    component: React.ComponentType<any>;
}

/**
 * UserDataRoute
 * ------------------
 * Personalized route that allows the usual route to have the UserDataContex inside it
 * and the wrapper will render the react component (the page).
 * @param rest the other arguments, like the path and all of that.
 */
export const UserDataRoute: React.FC<UserDataRouteProps> = ({ component: Component, ...rest }) => {
    return (
        <Route
        {...rest}
        render={(props) => (
            <UserDataWrapper>
            {/* Props is the component */}
            <Component {...props} />
            </UserDataWrapper>
        )}
        />
    );
};
