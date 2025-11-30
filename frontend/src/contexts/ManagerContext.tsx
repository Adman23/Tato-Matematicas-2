/**
 * !! NEW FILE !!
 * 
 *  -> Improve data retrieval and management for lists of users
 *  -> Will be used by teachers and admins to manage the users
 *  -> Will be loaded only one time, reloaded when needed
 * 
 * Manager Context
 * -----------------------------------
 * Context for managing a collection of users under a manager (teacher/admin)
 * Stores:
 * - id: id of the manager
 * - users: map of user objects with their data
 * - loading: fetch state
 * 
 * Allows to:
 * - Load users for a specific manager
 * - Manage the list of users
 * -------------------------------
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { userAPI, teacherAPI, fetchAllNonAdmin, type User, type UserData } from '../lib/api';
import { useAuth } from './AuthContext';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';


interface ManagerUserEntry {
  user: User;
  data: UserData | null;
}

interface ManagerContextType {
  users: Map<string, ManagerUserEntry>;
  loadingUsers: boolean;
  retrieveUser: (user_id: string) => void;
  /*
  loadUsers: (managerId: string) => Promise<void>;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  */
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

/**
 * Context provider
 * 
 * @brief This context is for managing users under a manager (teacher/admin)
 * @param children - children pages that will have access
 * @returns provider that gives the context to the app
 *
 * @example
 * ```tsx
 * <ManagerProvider>
 *   <App />
 * </ManagerProvider>
 * ```
 */
export const ManagerProvider: React.FC<{ children: ReactNode, manager_id: string, manager_role: string }> = ({ children, manager_id, manager_role }) => {
  const [users, setUsers] = useState<Map<string, ManagerUserEntry>>(new Map());
  const [loading, setLoading] = useState(true);


  /**
   * @brief Fetch list of users from the API
   * @summary This function does two different things, in case its an admin
   *          it will retrieve all the teachers and all the students with only the
   *          basic info, if its a teacher it will only retrieve all the students associated 
   *          the classes they teach.
   * @returns the response data from the API call
   */
  const fetchUsers = async (): Promise<User[]> => {
      var response = [] as User[];
      if (manager_role === "admin")
          response = await fetchAllNonAdmin();
      else
      if (manager_role === "teacher") {
          response = await teacherAPI.fetchStudentsByTeacher();
      }
      return response;
  }

  /**
   * !! IMPORTANT
   *  -> As the other context, we should implement something to watch for changes
   *  -> made by other users in real time, for example, if you close the page and
   *  -> another teacher changes the primary color of a student you manage too, 
   *  -> when you open the page the program should detect changes and update
   *  -> accordingly, either reloading everything or by reloading only the 
   *  -> edited part. The problem is when they remove / add users or groups, in that
   *  -> case it should reload completely.
   * 
   * @brief Main useEffect for the manager, that loads all the users (related)
   *        It should not reload normally, only when called (or logged out / closed
   *        and opened the page). All the userData loads as null, when accesing
   *        the individual users, the data will be fetched and saved on the map
   *        and the localStorage (so it can be retrieved). 
   *      
   */
  useEffect(() => {
    const fetchData = async () => {
      console.log("USE EFFECT MANAGER");
      const savedUsers = localStorage.getItem(`user_list_${manager_id}`);
      if (savedUsers){
        try {
            const parsedArray = JSON.parse(savedUsers);
            setUsers(new Map(parsedArray));
        } catch (e) {
            console.error("Error parsing localstorage", e);
            localStorage.removeItem(`user_list_${manager_id}`);
        }
      }


      if (!savedUsers) {
        const fetchedUsers = await fetchUsers();
        // Create the map with the fetched users
        const userMap = new Map<string, ManagerUserEntry>(
          fetchedUsers.map(user => [
              user.id,                   
              { user: user, data: null }
          ])
        );
        
        // Set it to the variable and the localStorage
        setUsers(userMap);
        localStorage.setItem(`user_list_${manager_id}`, JSON.stringify(Array.from(userMap.entries())));
      }
      setLoading(false);
    };
    if (manager_role === "admin" || manager_role === "teacher") fetchData();
  }, [manager_id]);


  /**
   * @brief This function is used to retrieve data of a user (user in the list)
   *        From the page, it should check if the data is null, and then if its null
   *        call this function
   * 
   * @param user The user to retrieve the data from, is not an id to easy access to the map
   */
  const retrieveUser = async(user_id: string) =>{
      setLoading(true);
      const userData = await userAPI.fetchUserData(user_id);
      setUsers(prevUsers => {
              const newMap = new Map(prevUsers);
              
              const user: User = {
                  id: userData.id,
                  username: userData.username,
                  role: userData.role,
                  photo_url: userData.photo_url,
                  group_id: userData.group_id,
                  group_alias: userData.group_alias,
              }
              const data: UserData = {
                  username: userData.username,
                  user_profile: userData.user_profile,
                  game_configurations: userData.game_configurations,
                  reinforcement_messages: userData.reinforcement_messages,
              }

              newMap.set(userData.id, { 
                  user: user, 
                  data: data 
              });

              // Actualizamos el localStorage
              localStorage.setItem(`user_list_${manager_id}`, JSON.stringify(Array.from(newMap.entries())));
              
              return newMap;
          });
      setLoading(false);
  }

  return (
      <ManagerContext.Provider 
      value={{ 
          users,
          loadingUsers: loading,
          retrieveUser,
          }}
      >
          {children}
      </ManagerContext.Provider>
  );
};


/**
 * Hook to access the management data
 * 
 * @throws Error if used outside of ManagerProvider.
 * @returns 
 * @example
 * ```tsx
 * const {} = useAssociatedUsers();
 * ```
 */
export const useManager = () => {
    const context = useContext(ManagerContext);
    if (context === undefined) {
        throw new Error('useManager must be used within a ManagerProvider');
    }
    return context;
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


export const ManagerDataWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {

  const { user, isAuthenticated, loadingAuth } = useAuth();

  // Show the loading page if its still loading
  if (loadingAuth) {
    return (
      <IonPage>
        <IonContent className="ion-text-center">
          <div className='group-management-spinner'>
            <IonSpinner name='crescent' />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // If its authenticated and exists, return the corresponding manager data
  if (isAuthenticated && user) {
    return (
      <ManagerProvider  manager_id={user.id} manager_role={user.role}>
        {children}
      </ManagerProvider>
    )
  }

  return <>{children}</>;
}