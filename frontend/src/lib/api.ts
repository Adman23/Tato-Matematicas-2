/**
 * Cliente API para el backend de TatoMaths.
 * --------------------------------------------------
 * Este módulo define:
 * - La configuración base de Axios (`api`)
 * - Interceptores de autenticación y manejo de errores
 * - Tipos de datos (User, Student, etc.)
 * - Servicios API de autenticación (`authAPI`)
 *
 * Se encarga de realizar las peticiones HTTP al backend
 * y añadir automáticamente el token correspondiente (usuario o estudiante).
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Cliente Axios configurado con la URL base del backend.
 * Incluye encabezado `Content-Type: application/json`.
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


/**
 * Interceptor de peticiones.
 * Añade automáticamente el token JWT del usuario o estudiante
 * en el encabezado `Authorization` de cada petición.
 */
api.interceptors.request.use((config) => {
  // Todos los usuarios (tutor/admin/estudiante) ahora usan access_token
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});


/**
 * Interceptor de respuestas.
 * Maneja errores comunes del backend (por ejemplo, 401 Unauthorized).
 * Si el token es inválido o expiró, limpia los datos locales
 * y redirige al login correspondiente.
 */
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
        // Token inválido o expirado, limpiar todo
        const isStudent = !!localStorage.getItem('student');

        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('student_id');
        localStorage.removeItem('student');

        // Redirigir según el tipo de usuario
        if (isStudent) {
          window.location.href = '/student-login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);


// ==== INTERFACES DE DATOS ====

/**
 * Representa un usuario del sistema (tutor o admin).
 */
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher';
  photo_url?: string;
}


/**
 * Representa un estudiante autenticado en el sistema.
 */
export interface Student {
  id: string;
  username: string;
  role: string;
  photo_url?: string;
  notes?: string;
  visual_preferences?: any;
  audio_preferences?: any;
  accessibility_settings?: any;
  game_preferences?: any;
}

/**
 * Respuesta de autenticación de usuario.
 */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * Respuesta de autenticación de estudiante.
 */
export interface StudentAuthResponse {
  access_token: string;
  token_type: string;
  student: Student;
}

/**
 * Datos requeridos para registrar un nuevo usuario.
 */
export interface RegisterData {
  username: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  photo_url?: string;
}

/**
 * Datos requeridos para iniciar sesión de usuario.
 */
export interface LoginData {
  username: string;
  password: string;
}

/**
 * Datos requeridos para el login de estudiante (pictogramas).
 */
export interface StudentLoginData {
  group_id: string;
  username: string;
  password: string; // formato: "perro-gato-león"
}


/**
 * Representa un grupo de estudiantes.
 */
export interface RegisterGroup {
  alias: string;
}


/**
 * Representa un grupo de estudiantes.
 */
export interface Group {
  id: number;
  alias: string;
}

/**
 * Información básica de estudiante para selección.
 */
export interface StudentBasicInfo {
  id: string;
  username: string;
  photo_url?: string;
}

// === ENDPOINTS DE AUTENTICACIÓN ===

/**
 * Conjunto de endpoints de autenticación.
 * Cada método devuelve una promesa con los datos del backend.
 */
export const authAPI = {
  /**
   * Registrar un nuevo usuario (admin o tutor).
   * @param data - Datos de registro.
   * @returns Información del usuario y tokens de acceso.
   */
  register: (data: RegisterData) => {
    return api.post('/auth/register', data);
  },

  /**
  * Registrar un nuevo grupo.
  * @param data - Datos del grupo.
  * @returns Información del grupo creado.
  */
  register_group: (data: RegisterGroup) => {
    // Backend router exposes POST /auth/register/group (singular)
    return api.post('/auth/register/group', data);
  },

  /**
   * Iniciar sesión de tutor o administrador.
   * @param data - Credenciales de inicio de sesión.
   * @returns Información del usuario y tokens de acceso.
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Comprueba si un username existe en la base de datos (tabla public.users).
   * @param username - Nombre de usuario a comprobar
   * @returns { exists: boolean }
   */
  checkUsername: async (username: string): Promise<{ exists: boolean }> => {
    const response = await api.get<{ exists: boolean }>(`/auth/exists/${encodeURIComponent(username)}`);
    return response.data;
  },

  /**
 * Comprueba si un grupo existe en la base de datos (tabla public.groups).
 * @param groupName - Nombre del grupo a comprobar
 * @returns { exists: boolean }
 */
  checkGroup: async (groupName: string): Promise<{ exists: boolean }> => {
    const response = await api.get<{ exists: boolean }>(`/auth/groups/exists/${encodeURIComponent(groupName)}`);
    return response.data;
  },

  /**
   * Obtener información del usuario autenticado actual.
   * @returns Perfil del usuario actual.
   */
  me: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Cerrar sesión del usuario actual.
   * Limpia tokens y perfil del almacenamiento local.
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  /**
   * Iniciar sesión de estudiante mediante secuencia de pictogramas.
   * @param data - Datos de pictogramas del estudiante.
   * @returns Token y perfil del estudiante autenticado.
   */
  loginStudent: async (data: StudentLoginData): Promise<StudentAuthResponse> => {
    const response = await api.post<StudentAuthResponse>('/auth/student/login', data);
    return response.data;
  },

  /**
   * Obtener todos los grupos disponibles.
   * @returns Lista de grupos.
   */
  getGroups: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/auth/groups');
    return response.data;
  },

  /**
   * Obtener estudiantes de un grupo específico.
   * @param groupId - ID del grupo.
   * @returns Lista de estudiantes del grupo.
   */
  getStudentsByGroup: async (groupId: string): Promise<StudentBasicInfo[]> => {
    const response = await api.get<StudentBasicInfo[]>(`/auth/groups/${groupId}/students`);
    return response.data;
  },
};

// === OTROS ENDPOINTS ===
/**
 * Obtener todos los profesores
 * @returns  Lista de profesores
 */
export async function fetchTeachers() {
  const response = await api.get("/api/admin/teachers");
  return response.data;
}

/**
 * Obtener todos los alumnos
 * @returns Lista de alumnos
 */
export async function fetchStudents() {
  const response = await api.get("/api/admin/students");
  return response.data;
}

/**
 * Obtener los alumnos de un profesor
 * @returns Lista de alumnos
 */
export async function fetchStudentsByTeacher() {
  try {
    const response = await api.get("/api/teacher/students");
    return response.data;
  } catch (err) {
    console.error("Error obteniendo estudiantes:", err);
    throw err; // opcional, para que el caller maneje el error
  }
}

/**
 * Obtener los alumnos de un profesor
 * @returns Lista de alumnos
 */
export async function fetchStudentsByTeacherProfile() {
  try {
    const response = await api.get("/api/teacher/students");
    return response.data;
  } catch (err) {
    console.error("Error obteniendo estudiantes:", err);
    throw err; // opcional, para que el caller maneje el error
  }
}

export async function fetchTeachersWithGroups() {
  const response = await api.get("/api/teacher/all");
  return response.data;
}

export async function fetchStudentsWithGroups() {
  const response = await api.get("/api/student/all");
  return response.data;
}

export async function assignStudentsToGroup(groupId: number, studentIds: string[]) {
  const response = await api.post('/api/admin/students/assign', {
    group_id: groupId,
    student_ids: studentIds,
  });
  return response.data;
}

export async function assignTeachersToGroup(groupId: number, teacherIds: string[]) {
  const response = await api.post('/api/admin/teachers/assign', {
    group_id: groupId,
    teacher_ids: teacherIds,
  });
  return response.data;
}

export async function unassignStudentsFromGroup(studentIds: string[]) {
  const response = await api.post('/api/admin/students/unassign', {
    student_ids: studentIds,
  });
  return response.data;
}

export async function unassignTeachersFromGroup(groupId: number, teacherIds: string[]) {
  const response = await api.post('/api/admin/teachers/unassign', {
    group_id: groupId,
    teacher_ids: teacherIds,
  });
  return response.data;
}

export async function fetchGroups() {
  const response = await api.get("/api/admin/groups");
  return response.data;
}

/**
 * Elimina un grupo por su id (requiere permisos de admin).
 * @param groupId - id del grupo a eliminar
 */
export async function deleteGroup(groupId: number) {
  const response = await api.delete(`/api/admin/groups/${groupId}`);
  return response.data;
}
// === SUBIDA Y RECUPERACIÓN DE IMÁGENES ===

/**
 * Sube una imagen al backend (Supabase Storage).
 * @param file - Archivo de imagen a subir
 * @param filename - Nombre único para el archivo
 * @returns URL pública de la imagen subida
 */
// En api.ts
export const uploadImage = async (file: File, filename: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', filename);

  // ✅ Usa la ruta completa si está en /api/admin
  const response = await api.post<{ name: string, url: string }>('/api/admin/upload_image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.name;
};

/**
 * Obtiene todas las imágenes disponibles en el bucket 'user_photo'.
 * @returns Mapa: { "filename.png": "https://public-url.com/..." }
 */
export async function getImages(): Promise<Record<string, string>> {
  const response = await api.get<Record<string, string>>('/api/admin/get_images');
  return response.data;
}

// ==== EXPORTACIÓN PRINCIPAL ====

/**
 * Exporta el cliente Axios preconfigurado.
 * Permite realizar peticiones adicionales fuera de `authAPI`.
 */
export default api;