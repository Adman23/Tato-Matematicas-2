# Documentación del Sistema de Autenticación - Frontend TatoMaths

Este documento explica cómo funciona el sistema de autenticación del frontend, incluyendo AuthContext, la API y el flujo de login.

## Índice

1. [Arquitectura General](#arquitectura-general)
2. [La Capa API (api.ts)](#la-capa-api-apits)
3. [El AuthContext](#el-authcontext)
4. [Flujo de Login - Tutor/Admin](#flujo-de-login---tutoradmin)
5. [Flujo de Login - Estudiante](#flujo-de-login---estudiante)
6. [Tipos de Datos](#tipos-de-datos)
7. [Crear Nuevas Páginas](#crear-nuevas-páginas)
8. [Persistencia y Sesiones](#persistencia-y-sesiones)

---

## Arquitectura General

El sistema de autenticación tiene tres capas principales:

```
┌─────────────────────────────────────────┐
│  Componentes (Login, Dashboard, etc)   │
│  - Usan useAuth() hook                  │
│  - Acceden a user/student               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  AuthContext (contexts/AuthContext.tsx) │
│  - Maneja estado global                 │
│  - Provee funciones login/logout        │
│  - Verifica tokens al iniciar           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  API Cliente (lib/api.ts)               │
│  - Axios con interceptores              │
│  - Añade tokens automáticamente         │
│  - Maneja errores 401                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Backend API (FastAPI)                  │
│  - Valida credenciales                  │
│  - Genera tokens JWT                    │
│  - Responde con datos de usuario        │
└─────────────────────────────────────────┘
```

---

## La Capa API (api.ts)

Ubicación: `src/lib/api.ts`

### Configuración Base

Crea una instancia de Axios que apunta al backend:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Interceptor de Request

Se ejecuta antes de cada petición HTTP. Su función es añadir automáticamente el token de autenticación:

```typescript
api.interceptors.request.use((config) => {
  // Busca primero el token de tutor/admin
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else {
    // Si no lo encuentra, busca el token de estudiante
    const studentToken = localStorage.getItem('token');
    if (studentToken) {
      config.headers.Authorization = `Bearer ${studentToken}`;
    }
  }
  return config;
});
```

Esto significa que no tienes que añadir manualmente el header Authorization en cada petición.

### Interceptor de Response

Se ejecuta cuando llega una respuesta del backend. Maneja errores de autenticación:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ignora 401 en endpoints de login (es normal si las credenciales son incorrectas)
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
                            error.config?.url?.includes('/auth/student') ||
                            error.config?.url?.includes('/auth/register');

      if (!isAuthEndpoint) {
        // Token inválido o expirado - limpia todo y redirige
        const hasStudentToken = localStorage.getItem('token');

        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('student_id');
        localStorage.removeItem('student');

        // Redirige según el tipo de usuario que estaba logueado
        if (hasStudentToken) {
          window.location.href = '/student-login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### Endpoints de Autenticación

El objeto `authAPI` exporta todas las funciones para comunicarse con el backend:

```typescript
export const authAPI = {
  // Registro de nuevo tutor/admin
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Login de tutor/admin
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Obtener usuario actual (verifica token)
  me: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  // Login de estudiante
  loginStudent: async (data: StudentLoginData): Promise<StudentAuthResponse> => {
    const response = await api.post<StudentAuthResponse>('/auth/student', data);
    return response.data;
  },
};
```

---

## El AuthContext

Ubicación: `src/contexts/AuthContext.tsx`

### Qué es un Context en React

Un Context es una forma de compartir datos entre todos los componentes de la aplicación sin tener que pasarlos manualmente como props. En este caso, compartimos el estado de autenticación.

### Estado que Maneja

```typescript
interface AuthContextType {
  user: User | null;              // Tutor o admin logueado
  student: Student | null;        // Estudiante logueado
  loading: boolean;               // true mientras verifica la autenticación
  login: (data: LoginData) => Promise<void>;
  loginStudent: (data: StudentLoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;       // true si hay user o student
  isStudent: boolean;             // true si hay student
  isTutor: boolean;              // true si user.role === 'tutor'
  isAdmin: boolean;              // true si user.role === 'admin'
}
```

### Inicialización al Cargar la App

Cuando la aplicación carga, AuthContext ejecuta este efecto:

```typescript
useEffect(() => {
  async function checkAuth() {
    // Busca token y datos de usuario en localStorage
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        // Verifica que el token sigue siendo válido
        const currentUser = await authAPI.me();
        setUser(currentUser);
      } catch (error) {
        // Token inválido - limpia localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    } else {
      // Si no hay usuario, busca estudiante
      const studentToken = localStorage.getItem('token');
      const savedStudent = localStorage.getItem('student');

      if (studentToken && savedStudent) {
        setStudent(JSON.parse(savedStudent));
      }
    }

    setLoading(false);
  }

  checkAuth();
}, []);
```

Este código se ejecuta una sola vez al montar la aplicación y restaura la sesión si existe un token válido.

### Función login (Tutor/Admin)

```typescript
const login = async (data: LoginData) => {
  const response = await authAPI.login(data);

  // Guarda en localStorage
  localStorage.setItem('access_token', response.access_token);
  localStorage.setItem('user', JSON.stringify(response.user));

  // Actualiza el estado
  setUser(response.user);

  // Limpia cualquier sesión de estudiante
  localStorage.removeItem('token');
  localStorage.removeItem('student_id');
  localStorage.removeItem('student');
  setStudent(null);
};
```

### Función loginStudent

```typescript
const loginStudent = async (data: StudentLoginData) => {
  const response = await authAPI.loginStudent(data);

  // Guarda en localStorage
  localStorage.setItem('token', response.token);
  localStorage.setItem('student_id', response.student_id);
  localStorage.setItem('student', JSON.stringify(response.student));

  // Actualiza el estado
  setStudent(response.student);

  // Limpia cualquier sesión de tutor/admin
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  setUser(null);
};
```

### Función logout

```typescript
const logout = async () => {
  try {
    // Intenta notificar al backend (solo para usuarios, no estudiantes)
    if (user) {
      await authAPI.logout();
    }
  } catch (error) {
    // Ignora errores del backend
    console.error('Error en logout:', error);
  }

  // Limpia todo el localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('student_id');
  localStorage.removeItem('student');

  // Resetea el estado
  setUser(null);
  setStudent(null);
};
```

### Cómo se Usa en la App

En `App.tsx`, el AuthProvider envuelve toda la aplicación:

```typescript
<IonApp>
  <AuthProvider>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/" exact component={Home} />
        <Route path="/login" exact component={Login} />
        <Route path="/dashboard" exact component={Dashboard} />
        {/* ... más rutas */}
      </IonRouterOutlet>
    </IonReactRouter>
  </AuthProvider>
</IonApp>
```

Esto hace que todas las páginas tengan acceso al contexto de autenticación.

---

## Flujo de Login - Tutor/Admin

### 1. Usuario Ingresa Credenciales

Archivo: `src/pages/auth/Login.tsx`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    await login(formData);
    history.replace('/dashboard');
  } catch (err: any) {
    if (err.response?.status === 404) {
      setError('Usuario no encontrado');
    } else if (err.response?.status === 401) {
      setError('Contraseña incorrecta');
    } else {
      setError('Error al iniciar sesión');
    }
  } finally {
    setLoading(false);
  }
};
```

### 2. AuthContext Procesa el Login

La función `login()` del contexto:
- Llama a `authAPI.login(data)`
- Guarda `access_token` y `user` en localStorage
- Actualiza el estado global
- Limpia cualquier sesión de estudiante

### 3. API Envía la Petición

`authAPI.login()` hace:
- POST a `/auth/login` con `{ username, password }`
- El interceptor de request añade headers
- Espera la respuesta del backend

### 4. Backend Responde

Si las credenciales son correctas:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user_123",
    "username": "juan_prof",
    "email": "juan@colegio.com",
    "full_name": "Juan Pérez",
    "role": "tutor"
  }
}
```

### 5. Dashboard Verifica Autenticación

Archivo: `src/pages/Dashboard.tsx`

```typescript
const { user, loading } = useAuth();

// Muestra spinner mientras verifica
if (loading) {
  return <IonSpinner />;
}

// Si no hay usuario, redirige a login
if (!user) {
  return <Redirect to="/login" />;
}

// Usuario autenticado - muestra contenido
return (
  <IonPage>
    <h1>Hola, {user.full_name}</h1>
    {/* ... contenido del dashboard */}
  </IonPage>
);
```

---

## Flujo de Login - Estudiante

### 1. Estudiante Selecciona Pictogramas

Archivo: `src/pages/auth/StudentLogin.tsx`

El estudiante toca pictogramas en orden (mínimo 3). Cuando hace submit:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    await loginStudent({ pictos: selectedPictos });
    history.replace('/student-dashboard');
  } catch (err: any) {
    setError('Te equivocaste, intenta de nuevo');
    setSelectedPictos([]); // Limpia la selección
  } finally {
    setLoading(false);
  }
};
```

### 2. AuthContext Procesa el Login

La función `loginStudent()`:
- Llama a `authAPI.loginStudent({ pictos: [...] })`
- Guarda `token`, `student_id` y `student` en localStorage
- Actualiza el estado
- Limpia cualquier sesión de tutor/admin

### 3. Backend Valida Pictogramas

Si la secuencia es correcta, responde:
```json
{
  "token": "abc123xyz...",
  "student_id": "student_456",
  "student": {
    "id": "student_456",
    "name": "María",
    "full_name": "María López",
    "picto_sequence": ["dog", "cat", "elephant"],
    "tutor_id": "user_123",
    "photo_url": "https://..."
  }
}
```

### 4. Student Dashboard Muestra Interfaz

Similar al dashboard de tutores, pero usando `student` en lugar de `user`:

```typescript
const { student, loading } = useAuth();

if (loading) return <IonSpinner />;
if (!student) return <Redirect to="/student-login" />;

return (
  <IonPage>
    <h1>Hola, {student.full_name}</h1>
    {/* ... contenido para estudiantes */}
  </IonPage>
);
```

---

## Tipos de Datos

### User (Tutor/Admin)

```typescript
interface User {
  id: string;              // ID único
  username: string;        // Usuario para login
  email: string;           // Correo electrónico
  full_name: string;       // Nombre completo
  role: 'admin' | 'tutor'; // Rol del usuario
}
```

### Student

```typescript
interface Student {
  id: string;              // ID único
  name: string;            // Nombre corto
  username?: string;       // Opcional
  full_name: string;       // Nombre completo
  picto_sequence: string[]; // Secuencia de pictogramas (contraseña)
  tutor_id: string;        // ID del tutor responsable
  photo_url?: string;      // Opcional - foto del estudiante
}
```

### LoginData (Input para login de tutor)

```typescript
interface LoginData {
  username: string;
  password: string;
}
```

### StudentLoginData (Input para login de estudiante)

```typescript
interface StudentLoginData {
  pictos: string[];  // Array de IDs de pictogramas
}
```

### AuthResponse (Respuesta del backend para tutores)

```typescript
interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
```

### StudentAuthResponse (Respuesta del backend para estudiantes)

```typescript
interface StudentAuthResponse {
  token: string;
  student_id: string;
  student: Student;
}
```

### RegisterData (Input para registro)

```typescript
interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'tutor';
}
```

---

## Crear Nuevas Páginas

### Página Protegida (Requiere Autenticación)

```typescript
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function MiPaginaProtegida() {
  const { user, loading } = useAuth();

  // Espera mientras verifica autenticación
  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-text-center">
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  // Redirige si no está autenticado
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Usuario autenticado - muestra contenido
  return (
    <IonPage>
      <IonContent>
        <h1>Bienvenido {user.full_name}</h1>
        <p>Tu email es: {user.email}</p>
      </IonContent>
    </IonPage>
  );
}
```

### Página Solo para Admins

```typescript
const { user, loading } = useAuth();

if (loading) return <IonSpinner />;

// Verifica que sea admin
if (!user || user.role !== 'admin') {
  return <Redirect to="/dashboard" />;
}

return <ContenidoSoloAdmins />;
```

### Página Solo para Estudiantes

```typescript
const { student, loading } = useAuth();

if (loading) return <IonSpinner />;

if (!student) {
  return <Redirect to="/student-login" />;
}

return <ContenidoParaEstudiantes />;
```

### Página Pública con Contenido Condicional

```typescript
const { isAuthenticated, user } = useAuth();

return (
  <IonPage>
    <IonContent>
      <h1>Página Pública</h1>

      {isAuthenticated ? (
        <p>Hola {user?.full_name}, ya estás logueado</p>
      ) : (
        <p>Por favor inicia sesión</p>
      )}
    </IonContent>
  </IonPage>
);
```

### Datos Disponibles en useAuth()

Cuando usas el hook, puedes extraer:

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| user | User \| null | Datos del tutor/admin |
| student | Student \| null | Datos del estudiante |
| loading | boolean | true mientras verifica auth |
| isAuthenticated | boolean | true si hay user o student |
| isStudent | boolean | true si hay student |
| isTutor | boolean | true si user.role === 'tutor' |
| isAdmin | boolean | true si user.role === 'admin' |
| login | function | Login de tutor/admin |
| loginStudent | function | Login de estudiante |
| register | function | Registrar nuevo usuario |
| logout | function | Cerrar sesión |

---

## Persistencia y Sesiones

### LocalStorage

El sistema usa localStorage del navegador para mantener la sesión:

| Key | Contenido | Usado Por |
|-----|-----------|-----------|
| access_token | Token JWT | Tutores y Admins |
| user | JSON con datos de User | Tutores y Admins |
| token | Token para estudiante | Estudiantes |
| student_id | ID del estudiante | Estudiantes |
| student | JSON con datos de Student | Estudiantes |

### Exclusividad en el Mismo Dispositivo

Solo puede haber un tipo de usuario logueado en cada navegador:
- Si un tutor hace login, se borran los datos de estudiante
- Si un estudiante hace login, se borran los datos de tutor

Sin embargo, en diferentes dispositivos pueden estar ambos tipos logueados simultáneamente porque cada navegador tiene su propio localStorage independiente.

Ejemplo:
- Tablet A: Tutor "Juan" logueado
- Tablet B: Estudiante "María" logueado
- Ambos funcionan sin problemas

Pero en la misma tablet:
- Primero tutor hace login
- Luego estudiante hace login
- El tutor queda deslogueado automáticamente

### Verificación de Token

Cada vez que la app carga:
1. AuthContext busca tokens en localStorage
2. Si encuentra `access_token`, llama a `authAPI.me()` para verificar que sigue siendo válido
3. Si el token es inválido (401), limpia localStorage
4. Si no hay `access_token`, busca `token` de estudiante

Durante el uso de la app:
- Cada petición HTTP incluye el token automáticamente (interceptor)
- Si el backend responde 401, el interceptor limpia todo y redirige al login

### Cierre de Sesión

Cuando se llama a `logout()`:
1. Se limpia todo localStorage
2. Se resetea el estado (user y student a null)
3. Opcionalmente se notifica al backend (solo para usuarios, no estudiantes)

---

## Resumen del Flujo Completo

```
1. Usuario abre la app
   ↓
2. App.tsx monta AuthProvider
   ↓
3. AuthProvider verifica localStorage
   ↓
4. Si hay token, valida con backend (authAPI.me)
   ↓
5. Si válido, restaura sesión
   Si inválido, limpia localStorage
   ↓
6. Usuario navega a página protegida
   ↓
7. Página usa useAuth() para verificar autenticación
   ↓
8. Si no autenticado, redirige a login
   Si autenticado, muestra contenido
   ↓
9. Todas las peticiones HTTP incluyen token automáticamente
   ↓
10. Si token expira (401), interceptor limpia y redirige
```

---

## Diferencias Clave Entre User y Student

| Aspecto | Tutor/Admin | Estudiante |
|---------|-------------|------------|
| Login con | username + password | Secuencia de pictogramas |
| Token en localStorage | access_token | token |
| Objeto guardado | user | student |
| Tipo de respuesta | AuthResponse | StudentAuthResponse |
| Dashboard | /dashboard | /student-dashboard |
| Verificación de token | authAPI.me() | Solo usa token guardado |
| Logout en backend | Sí | No |

---

## Notas Importantes

1. AuthProvider se configura una sola vez en App.tsx y envuelve toda la aplicación
2. Cualquier componente puede usar useAuth() sin necesidad de configuración adicional
3. Los interceptores de Axios manejan automáticamente tokens y errores 401
4. El sistema soporta dos tipos de usuarios pero solo uno puede estar logueado por navegador
5. La persistencia se basa completamente en localStorage del navegador
6. No hay refresh tokens - cuando expira el token, se pierde la sesión
