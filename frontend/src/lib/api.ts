/**
 * Cliente API para TatoMaths Backend
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Cliente axios con configuración base
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a todas las peticiones
api.interceptors.request.use((config) => {
  // Primero intenta con el token de tutor/admin
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else {
    // Si no hay access_token, intenta con el token de estudiante
    const studentToken = localStorage.getItem('token');
    if (studentToken) {
      config.headers.Authorization = `Bearer ${studentToken}`;
    }
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Solo redirigir si NO es un endpoint de login/auth
      // Los endpoints de login pueden devolver 401 por credenciales incorrectas
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
                            error.config?.url?.includes('/auth/student') ||
                            error.config?.url?.includes('/auth/register');

      if (!isAuthEndpoint) {
        // Token inválido o expirado, determinar qué tipo de usuario y limpiar
        const hasAccessToken = localStorage.getItem('access_token');
        const hasStudentToken = localStorage.getItem('token');

        // Limpiar tokens y datos
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('student_id');
        localStorage.removeItem('student');

        // Redirigir según el tipo de usuario
        if (hasStudentToken) {
          window.location.href = '/student-login';
        } else if (hasAccessToken) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// === TIPOS ===

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'tutor';
}

export interface Student {
  id: string;
  name: string;
  username?: string;
  full_name: string;
  picto_sequence: string[];
  tutor_id: string;
  photo_url?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface StudentAuthResponse {
  token: string;
  student_id: string;
  student: Student;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'tutor';
}

export interface LoginData {
  username: string;
  password: string;
}

export interface StudentLoginData {
  pictos: string[];
}

// === ENDPOINTS DE AUTENTICACIÓN ===

export const authAPI = {
  /**
   * Registrar nuevo usuario (admin o tutor)
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Login con username y contraseña
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Obtener usuario actual
   */
  me: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Cerrar sesión
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  /**
   * Login de estudiante con pictogramas
   */
  loginStudent: async (data: StudentLoginData): Promise<StudentAuthResponse> => {
    const response = await api.post<StudentAuthResponse>('/auth/student', data);
    return response.data;
  },
};

export default api;
