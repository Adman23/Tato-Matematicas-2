# 📁 Estructura de Páginas

Esta carpeta contiene todas las páginas de la aplicación, organizadas por funcionalidad y rol de usuario.

## 📂 Estructura actual

```
pages/
├── Home.tsx              # Página de inicio (selector de rol)
├── Dashboard.tsx         # Dashboard para tutores/admins
├── auth/                 # Páginas de autenticación
│   ├── Login.tsx         # Login tutor/admin (email/password)
│   └── StudentLogin.tsx  # Login estudiante (pictogramas)
└── student/              # Páginas para estudiantes
    └── Dashboard.tsx     # Dashboard del estudiante
```

## 📋 Estructura futura (según prioridades)

```
pages/
├── Home.tsx
├── Dashboard.tsx
├── auth/
│   ├── Login.tsx
│   └── StudentLogin.tsx
├── admin/                # 🔜 Prioridad 1: Gestión de usuarios
│   ├── TutorList.tsx     # Lista de tutores
│   ├── TutorForm.tsx     # Crear/editar tutor
│   ├── StudentList.tsx   # Lista de estudiantes
│   └── StudentForm.tsx   # Crear/editar estudiante
├── tutor/                # 🔜 Prioridad 2: Panel de tutor
│   ├── StudentList.tsx   # Mis estudiantes
│   ├── StudentProfile.tsx # Perfil del estudiante
│   └── StudentPreferences.tsx # Editar preferencias
├── student/
│   ├── Dashboard.tsx     # ✅ Ya existe
│   ├── GameList.tsx      # 🔜 Prioridad 3: Lista de juegos
│   └── Progress.tsx      # 🔜 Prioridad 5: Ver progreso
└── games/                # 🔜 Prioridad 3: Juegos
    ├── TouchNumber.tsx   # Toca el número que suena
    ├── OrderSequence.tsx # Ordena la secuencia
    ├── DistributeEqual.tsx # Reparte el mismo número
    └── LeaveEqual.tsx    # Deja el mismo número
```

## 🎯 Principios de organización

### 1. **Separación por rol**
- `auth/` - Páginas de autenticación (públicas)
- `admin/` - Solo para administradores
- `tutor/` - Solo para tutores
- `student/` - Solo para estudiantes
- `games/` - Juegos jugables por estudiantes

### 2. **Páginas comunes en raíz**
- `Home.tsx` - Página de inicio (acceso público)
- `Dashboard.tsx` - Dashboard genérico tutor/admin

### 3. **Nombres claros y descriptivos**
- Usar nombres que indiquen claramente la función
- Evitar abreviaciones confusas
- Mantener consistencia en la nomenclatura

### 4. **Un archivo por página**
- Cada archivo `.tsx` es una página completa
- Si una página es muy compleja, extraer componentes a `/components/`

## 🔗 Integración con rutas

Todas las páginas se registran en `src/App.tsx`:

```tsx
// Auth
import Login from './pages/auth/Login';
import StudentLogin from './pages/auth/StudentLogin';

// Student
import StudentDashboard from './pages/student/Dashboard';

// Dentro del router:
<Route path="/login" exact component={Login} />
<Route path="/student-login" exact component={StudentLogin} />
<Route path="/student-dashboard" exact component={StudentDashboard} />
```

## 📝 Cómo añadir una nueva página

1. **Crear el archivo en la carpeta apropiada**
   ```bash
   touch src/pages/admin/TutorList.tsx
   ```

2. **Escribir el componente**
   ```tsx
   // src/pages/admin/TutorList.tsx
   import { IonPage } from '@ionic/react';

   export default function TutorList() {
     return <IonPage>...</IonPage>;
   }
   ```

3. **Registrar la ruta en App.tsx**
   ```tsx
   import TutorList from './pages/admin/TutorList';

   <Route path="/admin/tutors" exact component={TutorList} />
   ```

4. **Añadir llamadas a la API si es necesario**
   - Usar funciones de `src/lib/api.ts`
   - No hacer `axios` directamente en el componente

---

**Última actualización:** 2025-01-12
**Estado:** ✅ Estructura modularizada y lista para crecer
