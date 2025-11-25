/**
 * Auth context
 * -----------------------------------
 * Context for every user, its lightweight and only contains basic info.
 * Its only loaded once when its logged in, and removed when logged out.
 * -------------------------------
 *
 * Allows to:
 * - Log in
 * - Log out
 * - Auth access to user data
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../lib/api';
import type { User, LoginData, RegisterData } from '../lib/api';

/**
 * !! EDITED
 *  -> Removed all the isType booleans, you can check the role of the user
 *  -> Removed deprecated functions
 *  -> Refactor the name "loading" to "loadingAuth", for compatibility with other contexts
 * Structure of the AuthContext.
 * Data and functions.
 */
interface AuthContextType {
  user: User | null;
  loadingAuth: boolean;
  isAuthenticated: boolean;
  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: User) => void;
}

/**
 * Context provider
 *
 * !! EDITED
 *  -> Removed logic for student, everything is user based now (problems may arise, check code)
 *  -> Removed the call to me();
 * @brief This context is only for the auth data, other data will have
 * @param children - children pages that will have access
 * @returns provider that gives the context to the app
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Here this is creating a set for loading and user, that changes the value of 'user' and 'loading'
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Loads user if token is in storage.
   */
  useEffect(() => {
    const loadAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const currentUser = JSON.parse(savedUser);
          setUser(currentUser);
        } catch (error) {
          // Mostrar también la respuesta del servidor (si la hay) para facilitar el debug
          console.error('Error loading user:', error, (error as any)?.response?.data);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadAuth();
  }, []);


  /**
   * !! EDITED
   *  -> Adapted for every type of User
   * 
   * @brief Log in for every user, saves the token and the data
   * @param data -> LoginData
   */
  const login = async (data: LoginData) => {
    const response = await authAPI.login(data);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  
  /**
   * @brief Register a new user, its used by the admin so it doesnt log in after.
   * @param data -> RegisterData
   */
  const register = async (data: RegisterData) => {
    await authAPI.register(data);
  };

  const updateUser = (data: User) => {
    // Actualizamos localStorage
    localStorage.setItem('user', JSON.stringify(data));
    // Y lo más importante: Actualizamos el estado de React
    setUser(data);
  };

  /**
   * !! EDITED
   *  -> Modified the return values to align with the AuthContextType
   * @brief Log out, cleans storage
   */
  const logout = async () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('student_id');
    localStorage.removeItem('student');
    localStorage.removeItem('user_data'); // Added to clear UserContext
    
    try {
      await authAPI.logout();
    } catch (error) {
      // ???
      console.log('Backend logout failed (ignored):', error);
    }
  };

  // Return of the context
  return (
    <AuthContext.Provider
      value={{
        user,
        loadingAuth: loading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

    /**
   * !! DEPRECATED
   * Inicia sesión de estudiante mediante pictogramas.
   * Guarda su token y datos básicos.
   * Ahora usa el nuevo flujo: group_id + username + password (pictogramas unidos por guiones).
   */
  /*
  const loginStudent = async (data: StudentLoginData) => {
    const response = await authAPI.loginStudent(data);
    // El backend ahora devuelve access_token (no token) y student (UserProfile)
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('student', JSON.stringify(response.student));
    localStorage.setItem('student_id', response.student.id);
    setStudent(response.student);
    setUser(null); // Asegurar que no hay usuario activo
  };
  */
};



/**
 * Hook to access the AuthContext.
 *
 * @throws Error if used outside of AuthProvider.
 * @returns Auth context with the user.
 *
 * @example
 * ```tsx
 * const { user, logout } = useAuth();
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



