# 🎨 Frontend - TatoMaths

Interfaz de usuario de TatoMaths construida con React e Ionic Framework.

---

## 🛠️ Tecnologías Utilizadas

| Tecnología | Versión | ¿Para qué sirve? |
|------------|---------|------------------|
| **React** | 18 | Framework para construir la interfaz de usuario con componentes |
| **Ionic React** | 7 | Componentes UI móviles (botones, cards, navegación) |
| **TypeScript** | 5 | JavaScript con tipos - detecta errores antes de ejecutar |
| **React Router** | 6 | Gestiona la navegación entre páginas (rutas) |
| **Axios** | 1.6 | Cliente HTTP para comunicarse con el backend (API calls) |
| **Vite** | 5 | Herramienta de desarrollo rápida (compila y recarga automáticamente) |

---

## 📁 Estructura del Proyecto

```
frontend/
├── src/                           # Todo el código fuente
│   ├── main.tsx                   # Punto de entrada (arranca React)
│   ├── App.tsx                    # Router principal (define todas las rutas)
│   ├── index.css                  # Estilos globales (colores, fuentes)
│   │
│   ├── contexts/                  # Estado global compartido
│   │   └── AuthContext.tsx        # 🔐 Gestión de login (user, student, logout)
│   │
│   ├── lib/                       # Utilidades y herramientas
│   │   └── api.ts                 # 🌐 Cliente HTTP (llama al backend)
│   │
│   └── pages/                     # 📄 TODAS las páginas de la app
│       ├── Home.tsx               # Página inicial (elige: Tutor o Estudiante)
│       ├── Home.css               # Estilos de Home
│       │
│       ├── auth/                  # Páginas de autenticación
│       │   ├── Login.tsx          # Login tutores/admins (email + password)
│       │   └── StudentLogin.tsx   # Login estudiantes (pictogramas 🐶🐱🐸)
│       │
│       ├── student/               # Páginas para estudiantes
│       │   └── Dashboard.tsx      # Panel del estudiante (juegos, progreso)
│       │
│       ├── admin/                 # (FUTURO) Panel de administrador
│       ├── tutor/                 # (FUTURO) Panel de tutor
│       └── games/                 # (FUTURO) Juegos interactivos
│
├── public/                        # Archivos estáticos (no se procesan)
│   └── assets/                    # Recursos (imágenes, audios)
│       └── pictograms/            # Pictogramas (tutorAdmin.png, student.png)
│
├── package.json                   # Dependencias del proyecto
├── vite.config.ts                 # Configuración de Vite
├── tsconfig.json                  # Configuración de TypeScript
└── .env                           # Variables de entorno (URL del backend)
```

---

## 🧩 ¿Qué hace cada parte?

### 1. **`main.tsx`** - Punto de entrada
```tsx
// Arranca toda la aplicación React
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />  // Renderiza el componente principal
);
```
**Función:** Inicializa React y monta la aplicación en el HTML.

---

### 2. **`App.tsx`** - Router principal
```tsx
// Define TODAS las rutas de la aplicación
<IonReactRouter>
  <Route exact path="/" component={Home} />
  <Route path="/login" component={Login} />
  <Route path="/student-login" component={StudentLogin} />
  <Route path="/student-dashboard" component={StudentDashboard} />
  // ... más rutas
</IonReactRouter>
```
**Función:**
- Gestiona la navegación (qué página mostrar según la URL)
- Envuelve la app con `AuthProvider` (context de autenticación)

---

### 3. **`contexts/AuthContext.tsx`** - Estado de autenticación
```tsx
// Estado global compartido por toda la app
export const AuthContext = createContext({
  user: null,           // Usuario tutor/admin (o null si no hay)
  student: null,        // Estudiante (o null si no hay)
  loading: false,       // Si está cargando
  login: () => {},      // Función para login tutor/admin
  loginStudent: () => {}, // Función para login estudiante
  logout: () => {}      // Función para cerrar sesión
});
```

**Función:**
- **Almacena** quién está logueado (tutor, admin o estudiante)
- **Guarda** el token en localStorage
- **Provee funciones** para login/logout que cualquier componente puede usar
- **Redirige** automáticamente tras login/logout

**Uso en componentes:**
```tsx
const { user, student, login, logout } = useAuth();

// Verificar si hay usuario
if (!user) return <Redirect to="/login" />;

// Hacer login
await login({ email: 'tutor@example.com', password: '123' });
```

---

### 4. **`lib/api.ts`** - Cliente HTTP

#### **Configuración base:**
```tsx
export const api = axios.create({
  baseURL: 'http://localhost:8000',  // URL del backend
  headers: { 'Content-Type': 'application/json' }
});
```

#### **Interceptores:**
```tsx
// Interceptor REQUEST: Añade token automáticamente a cada petición
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor RESPONSE: Redirige a login si hay error 401 (no autorizado)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expirado o inválido → ir a login
      window.location.href = '/login';
    }
  }
);
```

#### **APIs organizadas:**
```tsx
// Autenticación
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  loginStudent: (data) => api.post('/auth/student/login', data),
  logout: () => api.post('/auth/logout')
};

// Administrador (FUTURO)
export const adminAPI = {
  listTutors: () => api.get('/admin/tutors'),
  createStudent: (data) => api.post('/admin/students', data)
};

// Juegos (FUTURO)
export const gamesAPI = {
  createSession: (data) => api.post('/games/sessions', data),
  saveResult: (data) => api.post('/games/results', data)
};
```

**Función:**
- Centraliza TODAS las llamadas HTTP al backend
- Añade token automáticamente
- Maneja errores de autenticación
- Organiza endpoints por dominio (auth, admin, games)

---

### 5. **`pages/`** - Todas las páginas

#### **`Home.tsx`** - Página inicial
```tsx
// Muestra 2 botones: Tutor y Estudiante
<button onClick={() => history.push('/login')}>
  <img src="/assets/pictograms/tutorAdmin.png" />
  Tutor
</button>

<button onClick={() => history.push('/student-login')}>
  <img src="/assets/pictograms/student.png" />
  Estudiante
</button>
```
**Función:** Punto de entrada - el usuario elige su rol.

---

#### **`auth/Login.tsx`** - Login tutores/admins
```tsx
// Formulario username + contraseña
const handleSubmit = async () => {
  await login({ username, password });
  // AuthContext redirige automáticamente a /dashboard
};
```
**Función:** Login con nombre de usuario y contraseña.

---

#### **`auth/StudentLogin.tsx`** - Login estudiantes
```tsx
// Selector de pictogramas (5 animales disponibles)
const handleLogin = async () => {
  await loginStudent({ pictos: ['perro', 'gato', 'tortuga'] });
  // AuthContext redirige a /student-dashboard
};
```
**Función:** Login accesible con pictogramas de imágenes (sin teclado, sin texto).

---

#### **`student/Dashboard.tsx`** - Panel del estudiante
```tsx
const { student, logout } = useAuth();

// Verificar que hay estudiante logueado
if (!student) return <Redirect to="/student-login" />;

// Mostrar nombre y botón de logout
return (
  <div>
    <h1>Hola, {student.full_name}</h1>
    <button onClick={logout}>Salir</button>
  </div>
);
```
**Función:**
- Panel principal del estudiante
- Muestra juegos disponibles (FUTURO)
- Muestra progreso (FUTURO)

---

## 🔄 Flujo de Autenticación

### **Para Tutores/Admins:**
```
1. Usuario va a /login
   ↓
2. Escribe nombre de usuario y contraseña
   ↓
3. Click "Iniciar sesión"
   ↓
4. Login.tsx llama a login() del AuthContext
   ↓
5. AuthContext llama a authAPI.login()
   ↓
6. Backend busca usuario por username y valida contraseña
   ↓
7. AuthContext guarda token en localStorage
   ↓
8. AuthContext guarda user en estado
   ↓
9. Redirige a /dashboard
```

### **Para Estudiantes:**
```
1. Usuario va a /student-login
   ↓
2. Selecciona 3 pictogramas en orden (perro → gato → tortuga)
   ↓
3. Click "Entrar"
   ↓
4. StudentLogin.tsx llama a loginStudent() del AuthContext
   ↓
5. AuthContext llama a authAPI.loginStudent()
   ↓
6. Backend valida secuencia de pictogramas y devuelve token
   ↓
7. AuthContext guarda token en localStorage
   ↓
8. AuthContext guarda student en estado
   ↓
9. Redirige a /student-dashboard
```

---

## 🔐 Protección de Rutas

### **Patrón estándar:**
```tsx
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';

export default function ProtectedPage() {
  const { user, loading } = useAuth();

  // 1. Si está cargando, mostrar spinner
  if (loading) {
    return <IonSpinner />;
  }

  // 2. Si no hay usuario, redirigir a login
  if (!user) {
    return <Redirect to="/login" />;
  }

  // 3. Si hay usuario, mostrar página
  return (
    <IonPage>
      <h1>Página protegida</h1>
    </IonPage>
  );
}
```

**Función:** Evita que usuarios no logueados accedan a páginas privadas.

---

## 🎨 Organización de Páginas

### **Por Rol de Usuario:**
```
pages/
├── Home.tsx                 # Público (todos)
├── auth/                    # Público (todos)
│   ├── Login.tsx
│   └── StudentLogin.tsx
├── student/                 # Solo estudiantes
│   ├── Dashboard.tsx
│   └── Games.tsx (futuro)
├── tutor/                   # Solo tutores
│   ├── Dashboard.tsx
│   └── Students.tsx (futuro)
└── admin/                   # Solo admins
    ├── Dashboard.tsx
    └── Tutors.tsx (futuro)
```

**Regla:** Cada carpeta agrupa páginas del mismo tipo de usuario.

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (http://localhost:5173)
npm run dev

# Compilar para producción
npm run build

# Vista previa del build
npm run preview

# Linting (verificar errores de código)
npm run lint
```

---

## 🔧 Variables de Entorno

### **`.env`**
```bash
VITE_BACKEND_URL=http://localhost:8000
```

**Uso en código:**
```tsx
const API_URL = import.meta.env.VITE_BACKEND_URL;
```

**Nota:** Todas las variables deben empezar con `VITE_` para que Vite las reconozca.

---

## 📖 Ejemplo Completo: Añadir una Nueva Página

### **Paso 1: Crear el archivo**
```bash
touch src/pages/admin/TutorList.tsx
```

### **Paso 2: Escribir el componente**
```tsx
// src/pages/admin/TutorList.tsx
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { Redirect } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../lib/api';

export default function TutorList() {
  const { user, loading } = useAuth();
  const [tutors, setTutors] = useState([]);

  // Proteger ruta
  if (loading) return <div>Cargando...</div>;
  if (!user || user.role !== 'admin') return <Redirect to="/login" />;

  // Cargar tutores al montar
  useEffect(() => {
    const fetchTutors = async () => {
      const data = await adminAPI.listTutors();
      setTutors(data);
    };
    fetchTutors();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Lista de Tutores</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <ul>
          {tutors.map(tutor => (
            <li key={tutor.id}>{tutor.full_name}</li>
          ))}
        </ul>
      </IonContent>
    </IonPage>
  );
}
```

### **Paso 3: Registrar la ruta en App.tsx**
```tsx
// src/App.tsx
import TutorList from './pages/admin/TutorList';

// Dentro del <IonReactRouter>
<Route path="/admin/tutors" component={TutorList} />
```

### **Paso 4: Añadir endpoint en api.ts**
```tsx
// src/lib/api.ts
export const adminAPI = {
  listTutors: async () => {
    const response = await api.get('/admin/tutors');
    return response.data;
  }
};
```

¡Listo! La página ya funciona en `http://localhost:5173/admin/tutors`

---

## 📚 Enlaces Útiles

- **Ionic React**: https://ionicframework.com/docs/react
- **React Docs**: https://react.dev
- **Axios**: https://axios-http.com
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Vite**: https://vitejs.dev

---

**Última actualización:** 2025-01-13
**Estado:** ✅ Estructura lista para desarrollo
