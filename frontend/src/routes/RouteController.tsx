

/**
 * !! NEW
 *  -> Controller to use in App.tsx to manage all the redirections in all the pages
 * 
 * 
 * !! DEPRECATED
 *  -> Not really useful, wasted time
 *  
 * @brief Route controller. Using the security definer redirects every request if needed
 * 
 */


import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';
import { SECURITY_RULES, ROLE_DASHBOARDS } from './securityDefiner';
import { useAuth } from '../contexts/AuthContext'

import type {Role} from '../lib/api.ts';


export const RouteController: React.FC = () => {
    // The ion router allows for better control for routing in an ionic app.
    const location = useLocation();
    const router = useIonRouter();
    const {user, loadingAuth} = useAuth();

    /**
     * @brief Checks the role of the user (if any) and applies the rules (if any) defined
     *        in securityDefiner. Functionality can be expanded, in theory this is enough.
     * 
     * In App.tsx this should redirect in case something is wrong, otherwise the behaviour 
     * is as always.
     */
    useEffect(() => {
      // In case its loading the user
      if (loadingAuth) return;

      // Get the pathname
      const currentPath = location.pathname;

      // Get the role of the current user (if there is one)
      const userRole = user?.role as Role; 

       // Check for security rules
      const matchedRule = SECURITY_RULES.find(rule => 
        currentPath.startsWith(rule.url)
      );

      // if there is none, continue
      if (!matchedRule) return;

      /** 
       * If userRole has a value, that means there is a logged in user.
       * If there is a user logged in, we check if its a valid url
       */
      if (userRole) {
        console.log("Route controller in action, user logged in");

        // Verify the rights
        const hasPermission = matchedRule.allowed.includes(userRole);

        // Redirect in case its not allowed
        if (!hasPermission) {
          console.warn(`Access denied, redirect to ${ROLE_DASHBOARDS[userRole]}`);
          router.push(ROLE_DASHBOARDS[userRole], 'root', 'replace');
          return;
        }
      }
      else{
        router.push("/student/login", 'root', 'replace');
        return;
      }
    }, [location, router, user]); // Always plays when url is changed

  return null;
};
