/**
 * !! NEW FILE !!
 * 
 *  -> Improve data retrieval and management for user information
 *  -> Will be used by teachers and students, admins wont even touch it
 *  -> Should be loaded one time at the start and then recharged only when needed
 *  -> Will have all the data of the user, needs only the id to compare with the logged user (and verify)
 * 
 * User context
 * -----------------------------------
 * Context for every user, its heavy in data, because it has:
 * - id
 * - user_profile: 
 *   - data1
 *   - data2
 *   - ...
 * - game_configuration:
 *   - data1
 *   - data2
 *   - ...
 * -reinforcement_messages
 * -------------------------------
 *
 * Allows to:
 * - Apply the theme assigned to the user in the profile
 * - Control all the UI aspects depending on the specific user
 * - Play the games with the specific configuration of the user
 * - Show the personalized messages in the games for the user
 */

/* Reference for imports
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../lib/api';
import type { User, LoginData, RegisterData } from '../lib/api';
*/

import React, { createContext, useEffect, } from 'react';
import type { ReactNode } from 'react';

/**
 * Structure of the UserContext.
 * Data and functions.
 */
interface UserContextType {
    userData: string;
    loading: boolean;
    // TODO Add the functions created below
}

// Create the Context based on the interface
const UserContext = createContext<UserContextType | undefined>(undefined);

/** 
 * Context provider
 * 
 * @brief This is the provider for the context that will hold the user data
 * @param children - children pages that will have access
 * @returns provider that gives the context to the app
 * 
 * @example
 * ```tsx
 * <UserDataProvider>
 *  <App />
 * </UserDataProvider>
 * ```
*/
export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Here we would have the state and functions to manage user data
    const userData = "Sample User Data"; // Placeholder for actual user data
    const loading = false; // Placeholder for loading state

  useEffect(() => {
    // Logic to fetch and set user data would go here
  }, []);

  // Functions related to user data managemente would go here

    return (
        <UserContext.Provider 
        value={{ 
                userData, 
                loading 
            }}
        >
            {children}
        </UserContext.Provider>
    );

};

/** 
 * Hook to access the UserContext.
 *
 * @throws Error if used outside of UserDataProvider.
 * @returns User context with the user data.
 *
 * @example
 * ```tsx
 * const { userData } = useUserData();
 * ```
 */
export const useUserData = () => {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}
