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

import React, { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserData } from '../lib/api';
import { userAPI } from '../lib/api';

/**
 * Structure of the UserContext.
 * Data and functions.
 */
interface UserContextType {
    userData: UserData | null;
    loading: boolean;
    refreshUserData: () => Promise<void>;
}

// Create the Context based on the interface
const UserContext = createContext<UserContextType | undefined>(undefined);


/** 
 * Context provider
 * 
 * @brief This is the provider for the context that will hold the user data
 * @param children - children pages that will have access
 * @param user_id  - The authenticated user logged in 
 * @returns provider that gives the context to the app
 * 
 * @example
 * ```tsx
 * <UserDataProvider>
 *  <App />
 * </UserDataProvider>
 * ```
*/
export const UserDataProvider: React.FC<{ children: ReactNode, user_id: string}> = ({ children, user_id }) => {
  // temporal variables and setters for them 
  const [userData, setUserData] = useState<UserData | null>(null); 
  // Loading state is to use the guard pattern to avoid showing anything before the data is loaded
  const [loading, setLoading] = useState(true);

  
  /**
   * @brief Fetch user data from the API
   * @summary This function should return the json with all the user data
   *          the structure will be defined in UserData interface in api.ts
   *          Anywhere in the provider we can call this function to get the data
   *          but its recommended to use it only when needed, not on every render
   * @returns the response data from the API call
   */
  const fetchUserData = async (): Promise<UserData> => {
    const response = await userAPI.fetchUserData(user_id); // Example API call
    return response; // Assuming the API returns user data in response.data
  }

  // Its important to understand that when data is stored on the local storage its 
  // stored as a string, so we need to stringify when savind and parse when retrieving
  useEffect(() => {
    const fetchData = async () => {
      const savedUserData = localStorage.getItem('user_data');
      if (savedUserData) {
        // The page is trying to access user data and its already in local storage
        setUserData(JSON.parse(savedUserData));
      } else {
        // In case there is no userData in local storage, fetch it from the API
        const fetchedUserData = await fetchUserData();
        // Save it to local storage for future use
        localStorage.setItem('user_data', JSON.stringify(fetchedUserData));
        setUserData(fetchedUserData); 
      }
      setLoading(false);
    };
    fetchData();
  }, []);




  //-Functions related to user data managemente would go here----------------------------------
  /**
   * @brief Refresh the entire user data from the API
   * @summary This function fetches the latest user data from the API
   *          and updates both the context state and local storage
   */
  const refreshUserData = async () => {
    setLoading(true);
    const fetchedUserData = await fetchUserData();
    localStorage.setItem('user_data', JSON.stringify(fetchedUserData));
    setUserData(fetchedUserData);
    setLoading(false);
  }

  // TODO: Functions to update specific parts of the user data can be added here

  //-------------------------------------------------------------------------------------------
  
  
  // Return of the context provider
  return (
      <UserContext.Provider 
      value={{ 
              userData,
              loading,
              refreshUserData,
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
