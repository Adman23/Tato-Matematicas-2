/**
 * Contexto de Autenticación Unificado
 * -----------------------------------
 * Maneja el estado global tanto de usuarios (tutores/admins)
 * como de estudiantes en la aplicación.
 *
 * Permite:
 * - Iniciar sesión (usuarios o estudiantes)
 * - Registrar nuevos usuarios
 * - Cerrar sesión
 * - Mantener el estado de autenticación en toda la app
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../lib/api';
import type { User, Student, LoginData, RegisterData, StudentLoginData } from '../lib/api';

/**
 * Estructura del contexto de autenticación.
 * Define los datos y funciones disponibles para toda la aplicación.
 */
interface AuthContextType {
  user: User | null;
  student: Student | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  loginStudent: (data: StudentLoginData) => Promise<void>;
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
      // Intentar cargar tutor/admin
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verificar que el token siga siendo válido
          const currentUser = await authAPI.me();
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }

      // Intentar cargar estudiante
      const studentToken = localStorage.getItem('token');
      const savedStudent = localStorage.getItem('student');

      if (studentToken && savedStudent) {
        try {
          setStudent(JSON.parse(savedStudent));
        } catch (error) {
          console.error('Error loading student:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('student');
          localStorage.removeItem('student_id');
          setStudent(null);
        }
      }

      setLoading(false);
    };

    loadAuth();
  }, []);

  /**
   * Inicia sesión de tutor o administrador.
   * Guarda el token y los datos del usuario en localStorage.
   */
  const login = async (data: LoginData) => {
    const response = await authAPI.login(data);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    setStudent(null); // Asegurar que no hay estudiante activo
  };

  /**
   * Inicia sesión de estudiante mediante pictogramas.
   * Guarda su token y datos básicos.
   */
  const loginStudent = async (data: StudentLoginData) => {
    const response = await authAPI.loginStudent(data);
    localStorage.setItem('token', response.token);
    localStorage.setItem('student_id', response.student_id);
    localStorage.setItem('student', JSON.stringify(response.student));
    setStudent(response.student);
    setUser(null); // Asegurar que no hay usuario activo
  };

  /**
   * Registra un nuevo tutor o administrador.
   * Deja la sesión iniciada tras el registro.
   */
  const register = async (data: RegisterData) => {
    const response = await authAPI.register(data);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    setStudent(null); // Asegurar que no hay estudiante activo
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
    localStorage.removeItem('token');
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
        isTutor: user?.role === 'tutor',
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