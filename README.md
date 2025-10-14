#  TatoMaths - Aplicación Educativa Accesible

Juegos matemáticos para niños de 3-5 años y estudiantes con discapacidad cognitiva.

**Proyecto:** DGP - Diseño y Gestión de Proyectos
**Tecnologías:** React + Ionic (Frontend) | FastAPI (Backend) | PostgreSQL/Supabase (Base de Datos)

---

##  Documentación

| Documento | Descripción |
|-----------|-------------|
| **[ROADMAP.md](ROADMAP.md)** | 🗺️ Plan de desarrollo completo (fases y progreso) |
| **[README.md](README.md)** | 📚 Este archivo - Visión general |
| **[frontend/README.md](frontend/README.md)** | 🎨 Documentación técnica del frontend |
| **[backend/database/README.md](backend/database/README.md)** | 🗄️ Documentación de la base de datos |
| **[INICIO.md](INICIO.md)** | ⚡ Setup inicial GITHUB|

---

##  Arquitectura del Proyecto

```
dgp/
├── backend/          # API REST con FastAPI (Python)
│   ├── app/          # Código fuente
│   │   ├── main.py           # Punto de entrada
│   │   ├── routers/          # Endpoints (auth, admin, games...)
│   │   ├── services/         # Lógica de negocio (Supabase client)
│   │   └── schemas/          # Modelos de datos (Pydantic)
│   ├── database/     # Scripts SQL (estructura + datos)
│   └── .env          # Variables de entorno
│
├── frontend/         # Interfaz con React + Ionic
│   ├── src/
│   │   ├── pages/            # Páginas (Home, Login, Dashboards, Juegos)
│   │   ├── contexts/         # Estado global (AuthContext)
│   │   └── lib/              # Utilidades (API client con Axios)
│   ├── public/       # Recursos estáticos (imágenes, audios)
│   └── .env          # Variables de entorno
│
├── .venv/            # Entorno virtual Python
├── package.json      # Scripts NPM del proyecto raíz
├── ROADMAP.md        # Plan de desarrollo
└── README.md         # Este archivo
```

---

##  Cómo Iniciar la Aplicación

### **Requisitos Previos**
- **Python 3.10+** instalado
- **Node.js 18+** instalado
- **Cuenta de Supabase** configurada
- **Git** instalado

### **1. Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd dgp
```

### **2. Configurar variables de entorno **
#### Lo más facil es copiar el .env.example en .env y rellenar conforme se  indica en el mismo .env.example

#### **Backend** (`backend/.env`):
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE=tu-service-role-key-aqui
ALLOWED_ORIGINS=http://localhost:5173
```

#### **Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

> **Nota:** Consulta `INICIO_RAPIDO.md` para obtener las claves de Supabase.

### **3. Instalar dependencias**

```bash
# Backend (Python)
python3 -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
cd backend
pip install -r requirements.txt
cd ..

# Frontend (Node.js)
cd frontend
npm install
cd ..
```

### **4. Configurar la base de datos (YA HECHO ver en supabase)**

Ejecuta los scripts SQL **en orden** en el SQL Editor de Supabase:

```bash
cd backend/database

# Ejecutar estos archivos en Supabase SQL Editor (en orden):
1. 00_drop_all.sql           # (Solo si reiniciar) Limpia todo
2. 01_enums.sql              # Tipos enumerados
3. 02_users_and_roles.sql    # Tabla de usuarios
4. 03_students_and_preferences.sql
5. 04_games_and_configurations.sql
6. 05_sessions_and_results.sql
7. 06_media_library.sql
8. 09_storage_buckets.sql    # Verificación de buckets
9. 10_initial_data.sql       # Datos iniciales (4 juegos + estudiante de prueba)
```

> **Detalle:** Ver [`backend/database/README.md`](backend/database/README.md) para más información.

### **5. Iniciar la aplicación**

#### **Opción A: Iniciar ambos servidores con un solo comando** ⚡
```bash
npm run dev
```

Esto arranca automáticamente:
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:5173

#### **Opción B: Iniciar manualmente** (dos terminales)
```bash
# Terminal 1 - Backend
npm run dev:backend
# O manualmente:
# cd backend && source ../.venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2 - Frontend
npm run dev:frontend
# O manualmente:
# cd frontend && npm run dev
```

### **6. Acceder a la aplicación**

- **Aplicación:** http://localhost:5173
- **API Docs (Swagger):** http://localhost:8000/docs
- **API Redoc:** http://localhost:8000/redoc

---

##  Usuarios de Prueba

### **Estudiante**
- **Método:** Login con pictogramas
- **Secuencia:** perro → gato → tortuga (3 clics en ese orden)
- **Nombre:** Pepito García

### **Admin/Tutor**
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Nombre:** Admin TatoMaths

---

##  Tecnologías

### **Frontend**
- **React 18** - Framework UI
- **Ionic 7** - Componentes móviles (botones, cards, navegación)
- **TypeScript** - JavaScript con tipos
- **React Router 6** - Navegación entre páginas
- **Axios** - Cliente HTTP para llamar al backend
- **Vite** - Build tool rápido

### **Backend**
- **FastAPI** - Framework web moderno (Python)
- **Pydantic** - Validación de datos
- **Supabase Python Client** - Cliente de Supabase
- **python-jose** - Tokens JWT
- **bcrypt** - Hash de contraseñas

### **Base de Datos**
- **PostgreSQL** - Base de datos relacional
- **Supabase** - BaaS (Backend as a Service)
  - Autenticación
  - Storage (archivos)
  - Realtime (futuro)

---

## 📊 Estado Actual del Proyecto

| Fase | Estado | Progreso |
|------|--------|----------|
| **Infraestructura** | ✅ Completado | 100% |
| **Autenticación** | 🔄 En progreso | 75% |
| **Gestión de usuarios** | ⏳ Pendiente | 0% |
| **Juegos** | ⏳ Pendiente | 0% |
| **Preferencias** | ⏳ Pendiente | 0% |

**Ver [ROADMAP.md](ROADMAP.md) para detalles completos.**

### ✅ Completado
- Base de datos completa (12 tablas + funciones SQL)
- Backend FastAPI funcionando
- Frontend React + Ionic con estructura modular
- Login tutores/admins (email + password)
- Login estudiantes (pictogramas accesibles)
- Sistema de autenticación unificado (AuthContext)
- Protección de rutas
- Página Home con diseño accesible
- Dashboard básico para estudiantes

### 🚧 En Progreso
- Registro de nuevos usuarios
- Gestión de contraseñas

### ⏳ Pendiente
- Panel de administrador (CRUD de tutores y estudiantes)
- Panel de tutor (gestionar estudiantes)
- 4 juegos matemáticos
- Sistema de preferencias y accesibilidad
- Visualización de progreso

---

## 📁 Archivos Clave

### **Backend**
| Archivo | Qué hace |
|---------|----------|
| `app/main.py` | Punto de entrada - Configura FastAPI y CORS |
| `app/routers/auth.py` | Endpoints de login/registro |
| `app/services/supabase.py` | Cliente para conectar con Supabase |
| `app/schemas/` | Modelos de datos (validación con Pydantic) |
| `database/*.sql` | Scripts de base de datos |

### **Frontend**
| Archivo | Qué hace |
|---------|----------|
| `src/main.tsx` | Punto de entrada - Arranca React |
| `src/App.tsx` | Define todas las rutas de la aplicación |
| `src/contexts/AuthContext.tsx` | Estado global de autenticación |
| `src/lib/api.ts` | Cliente HTTP (Axios) - Llama al backend |
| `src/pages/` | Todas las páginas (Home, Login, Dashboards) |

---

## 🎯 Próximos Pasos

Según el pliego técnico, las prioridades son:

1. **Completar autenticación** (registro, reset password)
2. **Panel de administrador** (CRUD de tutores y estudiantes)
3. **Sistema de preferencias** (colores, fuentes, accesibilidad)
4. **Primer juego** ("Toca el número que suena")
5. **Panel de tutor** (gestionar estudiantes y ver progreso)
6. **Juegos restantes** (3 juegos más)
7. **Visualización de progreso** (gráficas)
8. **Accesibilidad avanzada** (pulsadores, switches)

**Ver [ROADMAP.md](ROADMAP.md) para el plan detallado.**

---

## 🧪 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar todo (backend + frontend)
npm run dev:backend      # Solo backend
npm run dev:frontend     # Solo frontend

# Backend
cd backend
source ../.venv/bin/activate
uvicorn app.main:app --reload     # Servidor de desarrollo
pytest                             # Tests (futuro)

# Frontend
cd frontend
npm run dev              # Servidor de desarrollo
npm run build            # Compilar para producción
npm run preview          # Vista previa del build
npm run lint             # Verificar código

# Base de datos
# Ver backend/database/README.md
```

---

## 🐛 Troubleshooting

### **Error: No se conecta al backend**
- Verifica que el backend esté corriendo en http://localhost:8000
- Verifica el archivo `frontend/.env` tenga `VITE_API_URL=http://localhost:8000`

### **Error: 401 Unauthorized**
- El token expiró o es inválido
- Vuelve a hacer login

### **Error: Supabase connection failed**
- Verifica `backend/.env` tenga las claves correctas
- Verifica que tu proyecto de Supabase esté activo

### **Error: Module not found**
- Backend: `source .venv/bin/activate && pip install -r requirements.txt`
- Frontend: `cd frontend && npm install`

### **Error: La base de datos no tiene tablas**
- Ejecuta los scripts SQL en orden (ver paso 4)

---

## 📚 Recursos Externos

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Docs:** https://react.dev
- **Ionic React:** https://ionicframework.com/docs/react
- **Supabase Docs:** https://supabase.com/docs
- **Axios:** https://axios-http.com/
- **Pydantic:** https://docs.pydantic.dev/

---

## 👥 Colaboración

Para trabajar en equipo con Git/GitHub, consulta **[GUIA_COLABORACION.md](GUIA_COLABORACION.md)**.

### Flujo básico:
```bash
git pull origin main              # Actualizar
git checkout -b feature/mi-feature  # Nueva rama
# ... hacer cambios ...
git add .
git commit -m "Descripción"
git push origin feature/mi-feature
# Crear Pull Request en GitHub
```

---

## 📝 Licencia

MIT License - Ver archivo `LICENSE` para detalles.

---

## 📧 Contacto

**Equipo TatoMaths** - Proyecto DGP

---

**Última actualización:** 2025-01-13
**Versión:** 1.0.0
**Estado:** ✅ Infraestructura completa - En desarrollo activo
