/**
 * !! SUMMARY !!
 *  -> EDITED tag means that code has been changed, not only comments
 *  -> DEPRECATED tag means that its older code no longer useful
 *     -> There should be changes in other files to take into account when 
 *        code is deprecated, if something doesnt work like it should check the
 *        deprecated functions to maybe gain some insight.
 * 
 * !! EDITED
 *  -> Restructured almost all the functions
 *  -> Added logic for the axios response manager
 *  -> Edited and removed some functions
 * 
 * 
 * API Module
 * --------------------------------------------------
 * Includes:
 * - Axios config to manage errors for the request/response model.
 * - Data Types/Interfaces
 * - API Services -> connection to endpoints
 *
 * RESTFUL API client to interact with the backend services.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Axios client.
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


/**
 * Request interceptor.
 * Adds the access token to the header of the request (Authorization).
 */
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});


/**
 * !!NEW
 * Cleans the storage, used when logging out or expired/invalid token
 */
function emptyStorage() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  localStorage.removeItem('student_id');
  localStorage.removeItem('student');
}


/**
 * Response interceptor.
 * Exception handler for every type of error.
 * Expired or invalid tokens -> clears localStorage and redirects to login.
 * 
 * TODO: Finish error handling for Type 1 and Type 2 errors.
 * !!EDITED
 * Type 1: Network and client side errors
 *  -> Request fails to reach the API
 *  -> error.response undefined / null
 *  -> Possible reasons: FastAPI server down / CORS doesnt function well / user offline
 * 
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {

    // Type 1 Error----------------------------------------------
    if (!error.response) {
      // 1. Check for a timeout first
      if (error.code === 'ECONNABORTED') {
        console.error("Request Timed Out:", error.message);
        // Show a global toast
        // showToast("The server is taking too long to respond. Please try again.");
        return Promise.reject(error);
      }
    }
    // Type 2 Error----------------------------------------------
    else
      if (error.response?.status === 401) {
        // Solo redirigir si NO es un endpoint de login/auth
        // Los endpoints de login pueden devolver 401 por credenciales incorrectas
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
          error.config?.url?.includes('/auth/student') ||
          error.config?.url?.includes('/auth/register');

        if (!isAuthEndpoint) {
          // Token inválido o expirado, limpiar todo
          const isStudent = !!localStorage.getItem('student');
          emptyStorage();

          // Redirect
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


// ==== DATA INTERFACES ====

/**
 * !!EDITED
 *  -> Removed full_name and email fields. -> Not needed.
 * @brief Represents a user.
 */
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'teacher' | 'student';
  photo_url?: string;
}

/**
 * !!NEW
 * @brief Represents the user data, only for students and teachers.
 * @use for responses when loading the structures for the user (mainly login and reload)
 */
export interface UserData {
  user_profile: any;
  game_configuration: any;
  reinforcement_messages: any;
}

/**
 * @brief Auth response for users
 * @use   Log in
 */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/** 
 * @brief Represents the data needed to register any type of user
 * @use   Register endpoint when sending the request
 */
export interface RegisterData {
  username: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  photo_url?: string;
}

/**
 * !! EDITED
 *  -> Added group_id field, only for students so it can be null
 * 
 * @brief Login data
 * @use   Login endpoint when sending the request
 */
export interface LoginData {
  username: string;
  password: string;
  group_id?: string; // Only for users with role="student"
}

/**
 * Representa un grupo de estudiantes.
 */
export interface Group {
  id: number;
  alias: string;
}

/**
 * @brief Data to register a Group, not very useful but allows to expand the data
 * @use   Register group endpoint
 */
export interface RegisterGroup {
  alias: string;
}


/**
 * Respuesta al crear una sesión de juego
 */
export interface GameSessionResponse {
  session_id: string;
}

/**
 * Datos de una ronda de juego
 */
export interface RoundResult {
  round: number;
  numbers: number[];
  user_order: number[];
  correct_order: number[];
  is_correct: boolean;
  time_seconds: number;
  is_final_attempt?: boolean; // Opcional, por defecto true en backend
  omissions?: number; // Números que no colocó (dejó sin colocar)
}




/**
 * !!DEPRECATED 
 *  -> All is managed by user structure
 */
/* 
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
*/

/**
 * !!DEPRECATED
 *  -> All is managed by user structure
 */
/* 
export interface StudentAuthResponse {
  access_token: string;
  token_type: string;
  student: Student;
}
*/

/**
 * !! DEPRECATED
 *  -> All is managed by user structure
 * Datos requeridos para el login de estudiante (pictogramas).
 */
/*
export interface StudentLoginData {
  group_id: string;
  username: string;
  password: string; // formato: "perro-gato-león"
}
*/

/**
 * !! DEPRECATED
 *  -> Too similar to User
 *  -> Replaced all the uses with User (uses in api.ts and StudentLogin)
 * 
 * Información básica de estudiante para selección.
 */
/*
export interface StudentBasicInfo {
  id: string;
  username: string;
  photo_url?: string;
}
*/
//------------------------------------------------------------



// === AUTH API ===
/**
 * Auth endpoints.
 * Returns a promise (synchronous behavior handled in the caller) with the response data.
 */
export const authAPI = {
  /**
   * @brief Register new user
   * @param data - RegisterData
   * @returns Returns the info of the endpoint located in auth/register
   */
  register: (data: RegisterData) => {
    return api.post('/auth/register', data);
  },

  /**
  * @brief Register new group
  * @param data - RegisterGroup
  * @returns Information of the Group
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
   * !!! EDITED
   *  -> Name changed from 'me' to 'fetchBasicUserInfo'
   *  -> It was only used on AuthContext.tsx to reload the user
   *  -> Now it does the same, but the api call has been changed
   * Get the basic info from a user
   * @returns Basic user info
   */
  fetchBasicUserInfo: async (): Promise<User> => {
    const response = await api.get<User>('/user/basic_info');
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
   * Cerrar sesión del usuario actual.
   * Limpia tokens y perfil del almacenamiento local.
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
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
  getStudentsByGroup: async (groupId: string): Promise<User[]> => {
    const response = await api.get<User[]>(`/auth/groups/${groupId}/students`);
    return response.data;
  },

    /**
   * !! DEPRECATED
   * Iniciar sesión de estudiante mediante secuencia de pictogramas.
   * @param data - Datos de pictogramas del estudiante.
   * @returns Token y perfil del estudiante autenticado.
   */
  /*
  loginStudent: async (data: StudentLoginData): Promise<StudentAuthResponse> => {
    const response = await api.post<StudentAuthResponse>('/auth/student/login', data);
    return response.data;
  },
  */
};



// TODO: userAPI, it should handle user data fetching and updating
// === USER API ===
/**
 * !! NEW
 * User endpoints.
 * Manages user data fetching and updating.
 */
export const userAPI = {
  /**
   * !! NEW 
   * @param id -> id of the user in question
   * @returns the structure UserData with all the data of the user identified by id
   */
  fetchUserData: async(id: string): Promise<UserData> => {
    const response = await api.get<UserData>(`/user/${encodeURIComponent(id)}/user_data`);
    return response.data;
  }
};




// === OTHER ENDPOINTS ===
/**
 * Obtener todos los profesores
 * @returns  Lista de profesores
 */
export async function fetchTeachers() {
  const response = await api.get("/admin/teachers");
  return response.data;
}

/**
 * Obtener todos los alumnos
 * @returns Lista de alumnos
 */
export async function fetchStudents() {
  const response = await api.get("/admin/students");
  return response.data;
}

/**
 * Obtener los alumnos de un profesor
 * @returns Lista de alumnos
 */
export async function fetchStudentsByTeacher() {
  try {
    const response = await api.get("/teacher/students");
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
    const response = await api.get("/teacher/students");
    return response.data;
  } catch (err) {
    console.error("Error obteniendo estudiantes:", err);
    throw err; // opcional, para que el caller maneje el error
  }
}

export async function fetchTeachersWithGroups() {
  const response = await api.get("/teacher/all");
  return response.data;
}

export async function fetchStudentsWithGroups() {
  const response = await api.get("/student/all");
  return response.data;
}

export async function assignStudentsToGroup(groupId: number, studentIds: string[]) {
  const response = await api.post('/admin/students/assign', {
    group_id: groupId,
    student_ids: studentIds,
  });
  return response.data;
}

export async function assignTeachersToGroup(groupId: number, teacherIds: string[]) {
  const response = await api.post('/admin/teachers/assign', {
    group_id: groupId,
    teacher_ids: teacherIds,
  });
  return response.data;
}

export async function unassignStudentsFromGroup(studentIds: string[]) {
  const response = await api.post('/admin/students/unassign', {
    student_ids: studentIds,
  });
  return response.data;
}

export async function unassignTeachersFromGroup(groupId: number, teacherIds: string[]) {
  const response = await api.post('/admin/teachers/unassign', {
    group_id: groupId,
    teacher_ids: teacherIds,
  });
  return response.data;
}

export async function fetchGroups() {
  const response = await api.get("/admin/groups");
  return response.data;
}

/**
 * Elimina un grupo por su id (requiere permisos de admin).
 * @param groupId - id del grupo a eliminar
 */
export async function deleteGroup(groupId: number) {
  const response = await api.delete(`/admin/groups/${groupId}`);
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

  // ✅ Usa la ruta completa si está en admin
  const response = await api.post<{ name: string, url: string }>('/admin/upload_image', formData, {
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
  const response = await api.get<Record<string, string>>('/admin/get_images');
  return response.data;
}

// === ENDPOINTS DE JUEGOS ===

/**
 * Configuración de juego específica para un estudiante
 */
export interface GameConfig {
  game_id: number;
  game_key: string;
  user_id: string;
  number_range: string;
  settings: {
    options_count?: number;
    voice?: 'woman' | 'man';
    quantity?: number;
    order?: 'ascending' | 'descending';
  };
}

/**
 * Respuesta al crear una sesión de juego
 */
export interface GameSessionResponse {
  session_id: string;
}

/**
 * Datos de una ronda de juego
 */
export interface RoundResult {
  round: number;
  numbers: number[];
  user_order: number[];
  correct_order: number[];
  is_correct: boolean;
  time_seconds: number;
  is_final_attempt?: boolean; // Opcional, por defecto true en backend
  omissions?: number; // Números que no colocó (dejó sin colocar)
  attempts?: number; // Contador de intentos (veces que presionó "Repetir")
  hints?: number; // Contador de pistas usadas
}

/**
 * Datos de una ronda del juego 1: Elegir Número
 */
export interface RoundResultGame1 {
  round: number;
  numbers: number[];
  selected_number: number;
  correct_number: number | null;
  is_correct: boolean;
  time_seconds: number;
}


/**
 * Datos de una ronda del juego 2: Ordenar Secuencia
 */
export interface RoundResultGame2 {
  round: number;
  numbers: number[];
  user_order: number[];
  correct_order: number[];
  is_correct: boolean;
  time_seconds: number;
  is_final_attempt?: boolean; // Opcional, por defecto true en backend
  omissions?: number; // Números que no colocó (dejó sin colocar)
  attempts?: number; // Contador de intentos (veces que presionó "Repetir")
  hints?: number; // Contador de pistas usadas
}



/**
 * Conjunto de endpoints para juegos.
 *
 * Proporciona métodos para gestionar sesiones de juegos, configuraciones
 * y resultados a través de la API del backend.
 */
export const gamesAPI = {
  /**
   * Obtiene la configuración personalizada de un juego para un usuario (estudiante o profesor).
   *
   * Flujo de ejecución:
   * 1. Realiza petición GET al endpoint de configuración
   * 2. El backend consulta la tabla game_configs filtrada por user_id y game_key
   * 3. Devuelve la configuración específica (rango de números, cantidad, orden, etc.)
   *
   * @param userId - UUID del usuario (estudiante o profesor) en la base de datos
   * @param gameKey - Identificador del juego (ej: 'order_sequence', 'count_objects')
   * @returns Promesa que resuelve con la configuración del juego incluyendo settings personalizados
   *
   * @example
   * const config = await gamesAPI.getGameConfig('uuid-123', 'order_sequence');
   * console.log(config.settings.quantity); // 5
   * console.log(config.number_range); // '0-10'
   */
  getGameConfig: async (userId: string, gameKey: string): Promise<GameConfig> => {
    const response = await api.get<GameConfig>(`/games/config/${userId}/${gameKey}`);
    return response.data;
  },

  /**
   * Crea una nueva sesión de juego para tracking de resultados.
   *
   * Flujo de ejecución:
   * 1. Envía petición POST con user_id (estudiante o profesor) y game_key
   * 2. El backend crea un registro en game_sessions con timestamp de inicio
   * 3. Devuelve el ID de sesión que se usará para guardar rondas
   *
   * @param userId - UUID del usuario (estudiante o profesor) que jugará
   * @param gameKey - Identificador del juego a iniciar
   * @returns Promesa con el ID de sesión generado
   *
   * @example
   * const session = await gamesAPI.createGameSession('uuid-123', 'order_sequence');
   * console.log(session.session_id); // 'session-uuid-456'
   */
  createGameSession: async (userId: string, gameKey: string): Promise<GameSessionResponse> => {
    const response = await api.post<GameSessionResponse>('/games/sessions', {
      student_id: userId,
      game_key: gameKey
    });
    return response.data;
  },

  /**
 * Guarda el resultado de una ronda individual dentro de una sesión.
 *
 * Flujo de ejecución:
 * 1. Envía los datos de la ronda (números, respuesta, corrección, tiempo)
 * 2. El backend actualiza el campo results.attempts[] en game_sessions
 * 3. Incrementa contadores de total_correct o total_incorrect según resultado
 *
 * @param sessionId - ID de la sesión activa donde guardar
 * @param roundResult - Objeto con todos los datos de la ronda
 * @returns Promesa que resuelve cuando se guarda exitosamente
 *
 * @example
 * await gamesAPI.saveRoundResult('session-123', {
 *   round: 1,
 *   numbers: [1, 3, 5, 7, 9],
 *   selected_number: 5,
 *   correct_number: 5,
 *   is_correct: true,
 *   time_seconds: 12.5
 * });
 */
  saveRoundResultGame1: async (sessionId: string, roundResult: RoundResultGame1): Promise<void> => {
    await api.post(`/games/sessions/${sessionId}/round`, {
      round_result: roundResult
    });
  },


  /**
   * Guarda el resultado de una ronda individual dentro de una sesión.
   *
   * Flujo de ejecución:
   * 1. Envía los datos de la ronda (números, respuesta, corrección, tiempo)
   * 2. El backend actualiza el campo results.attempts[] en game_sessions
   * 3. Incrementa contadores de total_correct o total_incorrect según resultado
   *
   * @param sessionId - ID de la sesión activa donde guardar
   * @param roundResult - Objeto con todos los datos de la ronda
   * @returns Promesa que resuelve cuando se guarda exitosamente
   *
   * @example
   * await gamesAPI.saveRoundResult('session-123', {
   *   round: 1,
   *   numbers: [1, 3, 5, 7, 9],
   *   user_order: [1, 3, 5, 7, 9],
   *   correct_order: [1, 3, 5, 7, 9],
   *   is_correct: true,
   *   time_seconds: 12.5
   * });
   */
  saveRoundResultGame2: async (sessionId: string, roundResult: RoundResultGame2): Promise<void> => {
    await api.post(`/games/sessions/${sessionId}/round`, {
      round_result: roundResult
    });
  },

  /**
   * Finaliza una sesión de juego y guarda el tiempo total.
   *
   * Flujo de ejecución:
   * 1. Envía el tiempo total de juego en segundos
   * 2. El backend actualiza finished_at con timestamp actual
   * 3. Calcula estadísticas finales y cierra la sesión
   *
   * @param sessionId - ID de la sesión a finalizar
   * @param totalTimeSeconds - Tiempo total transcurrido desde el inicio
   * @returns Promesa que resuelve cuando se finaliza exitosamente
   *
   * @example
   * await gamesAPI.finishGameSession('session-123', 125.7);
   * // La sesión ahora está marcada como completada en BD
   */
  finishGameSession: async (sessionId: string, totalTimeSeconds: number): Promise<void> => {
    await api.post(`/games/sessions/${sessionId}/finish`, {
      total_time_seconds: totalTimeSeconds
    });
  }
};

// ==== EXPORTACIÓN PRINCIPAL ====

/**
 * Exporta el cliente Axios preconfigurado.
 * Permite realizar peticiones adicionales fuera de `authAPI`.
 */
export default api;