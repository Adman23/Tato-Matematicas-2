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
import type { User, Student, LoginData, RegisterData, StudentLoginData } from '../lib/api';

/**
 * Structure of the AuthContext.
 * Data and functions.
 */
interface AuthContextType {
  user: User | null;
  student: Student | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isStudent: boolean;
  isTutor: boolean;
  isAdmin: boolean;
}

/**
 * Componente proveedor del contexto de autenticación.
 *
 * @param children - Elementos hijos que tendrán acceso al contexto.
 *
 * @returns Un proveedor que envuelve la aplicación con la lógica de autenticación.
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
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Cargar usuario o estudiante guardado al iniciar la aplicación.
   * Si existe token en localStorage, se valida con el backend.
   */
  useEffect(() => {
    const loadAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');
      const savedStudent = localStorage.getItem('student');

      // Priorizar la carga de estudiante si existe (los estudiantes también tienen access_token)
      if (savedStudent) {
        try {
          setStudent(JSON.parse(savedStudent));
          setLoading(false);
          return; // Salir temprano, es un estudiante
        } catch (error) {
          console.error('Error loading student:', error);
          localStorage.removeItem('student');
          localStorage.removeItem('student_id');
          setStudent(null);
        }
      }

      // Si no hay estudiante, intentar cargar tutor/admin
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verificar que el token siga siendo válido
          const currentUser = await authAPI.me();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
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
   * Log in for every user
   * Saves the token and the data
   */
  const login = async (data: LoginData) => {
    const response = await authAPI.login(data);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    // setStudent(null); // Asegurar que no hay estudiante activo
  };

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

 /**
 * Registra un nuevo usuario (tutor, admin o estudiante).
 * NO inicia sesión ni modifica el estado de autenticación actual.
 * Ideal para uso desde el panel de administración.
 */
const register = async (data: RegisterData) => {
  await authAPI.register(data);
};

  /**
   * Cierra sesión (usuario o estudiante).
   * Limpia localStorage y estado local.
   */
  const logout = async () => {
    // Determinar si es un usuario o estudiante antes de limpiar
    const isUserLogout = !!user;

    // Limpiar primero el estado local
    setUser(null);
    setStudent(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('student_id');
    localStorage.removeItem('student');

    // Solo llamar al endpoint de logout para usuarios (tutores/admins), no estudiantes
    if (isUserLogout) {
      try {
        await authAPI.logout();
      } catch (error) {
        // Ignorar errores del logout del backend
        console.log('Backend logout failed (ignored):', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        student,
        loading,
        login,
        loginStudent,
        register,
        logout,
        isAuthenticated: !!user || !!student,
        isStudent: !!student,
        isTutor: user?.role === 'teacher',
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personalizado para acceder al contexto de autenticación.
 *
 * @throws Error si se usa fuera del `AuthProvider`.
 * @returns El contexto de autenticación con usuario, estado y funciones.
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