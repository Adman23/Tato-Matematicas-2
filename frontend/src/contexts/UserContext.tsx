/**
 * User context
 * 
 * Usage in App.tsx:
 *  import {UserDataWrapper} from "./contexts/UserContext"
 *  
 *  <AuthContext>
 *    ...
 *    <UserDataWrapper>
 *        routes
 *    </UserDataWrapper>
 *    ...
 *  </AuthContext>
 * 
 * Usage in pages:
 *   
 * 
 * -----------------------------------
 * !! DEPRECATED FORM OF DATA
 * Context for every user, its heavy in data, because it has:
{
    "user_profile":{
        "audio_preferences":{

        },
        "text_preferences":{
            "active_palette_idx": 0,
            "font_idx": 1,
            "font-size": 10,
            "fonts":["arial, ..."],
            "color_palettes":[
                {
                    "primary":      "codigo",
                    "accent":       "codigo",
                    "error":        "codigo",
                    "background":   "codigo",
                    "text_on_primary": "codigo",
                    "texto_on_bg":  "codigo"
                },
                {
                    "primary":      "codigo",
                    "accent":       "codigo",
                    "error":        "codigo",
                    "background":   "codigo",
                    "text_on_primary": "codigo",
                    "texto_on_bg":  "codigo"
                },
                {
                    "primary":      "codigo",
                    "accent":       "codigo",
                    "error":        "codigo",
                    "background":   "codigo",
                    "text_on_primary": "codigo",
                    "texto_on_bg":  "codigo"
                },
                {
                    "primary":      "codigo",
                    "accent":       "codigo",
                    "error":        "codigo",
                    "background":   "codigo",
                    "text_on_primary": "codigo",
                    "texto_on_bg":  "codigo"               
                }
            ],
            "text_options":{

            }
        },
        "accesibility_settings":{

        },
        "color_preferences":{
          "primary": "#50BFE6",
          "text_on_primary": "#FFFFFF",
          "background": "#F4F4F4",
          "text_on_bg": "#212121",
          "bubble": "#A9DAF3",
          "bubble_selected": "#FFB7FA",
          "bubble_correct": "#34D399",
          "bubble_incorrect": "#F87171",
          "feedback_correct": "#059669",
          "feedback_incorrect": "#b91c1c"
        }
    },
    "game_configurations": [
        {
        "id": 29,
        "game_id": 1,
        "settings": {
            "options_count": 4
        },
        "number_range": "0-10"
        },
        {
        "id": 30,
        "game_id": 2,
        "settings": {
            "order_type": "ascending",
            "sequence_count": 5
        },
        "number_range": "0-10"
        },
        {
        "id": 31,
        "game_id": 3,
        "settings": {
            "object_count": 8,
            "container_count": 2,
            "requires_operations": false
        },
        "number_range": "0-10"
        },
        {
        "id": 32,
        "game_id": 4,
        "settings": {
            "object_count": 8,
            "container_count": 2,
            "requires_operations": false
        },
        "number_range": "0-10"
        }
    ],
    "reinforcement_messages": []
}
 * -------------------------------
 *
 * 
 * Allows to:
 * - Apply the theme assigned to the user in the profile
 * - Control all the UI aspects depending on the specific user
 * - Play the games with the specific configuration of the user
 * - Show the personalized messages in the games for the user
 */


import React, { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserData, StudentMessage } from '../lib/api';
import { userAPI } from '../lib/api';
import { useAuth } from './AuthContext'

import { IonPage, IonContent, IonSpinner } from '@ionic/react';
/**
 * Structure of the UserContext.
 * Data and functions.
 */
interface UserContextType {
  userData: UserData | null;
  loadingUser: boolean;
  refreshUserData: () => Promise<void>;
  // Helpers to access reinforcement messages easily
  getAllMessages: () => StudentMessage[];
}

// Create the Context based on the interface
const UserContext = createContext<UserContextType | undefined>(undefined);

/** 
 * Context provider
 * 
 * @brief This is the provider for the context that will hold the user data
 *        Its not exported because it needs the user_id argument, and the wrapper
 *        needs to be used to engage with AuthContext and then it returns the provider
 * 
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
const UserDataProvider: React.FC<{ children: ReactNode, user_id: string }> = ({ children, user_id }) => {
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

  /**
   * @brief Its important to understand that when data is stored on the local storage its 
   *        stored as a string, so we need to stringify when savind and parse when retrieving
   */
  useEffect(() => {
    const fetchData = async () => {
      console.log("REFRESH USER_DATA")
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
  }, [user_id]);


  /**
   * @brief Second useEffect that applies the styles. It works when userData is modified, this
   *        happens at the start (when the first useEffect activates), when something is modified
   *        for the current user or when data is refreshed.     
   */
  /*useEffect(() => {
      if (userData){
          const root = document.documentElement;
          const userVisual = userData.user_profile.text_preferences;

          // console.log(userData.user_profile);
          // Apply the color palette
          if (userVisual.color_palettes){
            const color_palette = userVisual.color_palettes[userVisual.active_palette_idx];
            if (color_palette){
              root.style.setProperty('--ion-color-primary', color_palette.primary);
            }
          }
          console.log("Styles applied");
      }
  }, [userData]);*/
  useEffect(() => {
    if (userData?.user_profile?.color_preferences) {
        const root = document.documentElement;
        const colorPrefs = userData.user_profile.color_preferences;

        // Aplica cada color según tus variables CSS
        root.style.setProperty('--ion-color-primary', colorPrefs.primary);
        root.style.setProperty('--ion-color-primary-contrast', colorPrefs.background);
        root.style.setProperty('--bubble-bg', colorPrefs.bubble);
        root.style.setProperty('--bubble-selected-bg', colorPrefs.bubble_selected);
        root.style.setProperty('--tatomaths-text', colorPrefs.text_on_bg);
        root.style.setProperty('--tatomaths-text-primary', colorPrefs.text_on_primary);
        root.style.setProperty('--button-profile-bg', colorPrefs.button);

        console.log("Styles applied");
    }
}, [userData]);



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

  /** 
   * !! NEW
   *  -> Normalizes the raw messages from the user data into StudentMessage[]
   */
  const _normalizeMessages = (raw: any[]): StudentMessage[] => {
    if (!raw || !Array.isArray(raw)) return [];

    const mapped = raw.map((r: any) => {
      if (!r) return null;

      // The row can be { messages: {...} } or the message object itself
      const m = r.messages ? r.messages : r;
      if (!m) return null;

      // Coerce fields and provide sensible defaults
      const id = m.id !== undefined && m.id !== null ? String(m.id) : undefined;
      const type = m.type || 'unknown';
      const text_message = "¡" + m.text_message + ", " + (userData?.username || '') + "!";
      const icon_url = m.icon_url ?? null;
      const sound_url = m.sound_url ?? null;

      return {
        id,
        type,
        text_message,
        icon_url,
        sound_url,
      } as StudentMessage;
    }).filter(Boolean) as StudentMessage[];

    return mapped;
  }

  /** 
   * !! NEW
   *  -> Returns all the reinforcement messages for the user
   */

  const getAllMessages = (): StudentMessage[] => {
    const raw = userData?.reinforcement_messages || [];
    return _normalizeMessages(raw);
  }
  // --------------------------------------------------------------


  // Return of the context provider
  return (
    <UserContext.Provider
      value={{
        userData,
        loadingUser: loading,
        refreshUserData,
        getAllMessages,
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



export const UserDataWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {

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

  // If its authenticated and exists, return the corresponding userData
  if (isAuthenticated && user) {
    return (
      <UserDataProvider user_id={user.id}>
        {children}
      </UserDataProvider>
    )
  }

  return <>{children}</>;
}