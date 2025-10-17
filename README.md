#  TatoMaths - Aplicación Educativa Accesible

**Proyecto:** DGP - Diseño y Gestión de Proyectos
**Tecnologías:** React + Ionic (Frontend) | FastAPI (Backend) | PostgreSQL/Supabase (Base de Datos)

---

##  Documentación

| Documento | Descripción |
|-----------|-------------|
| **[INICIO.md](INICIO.md)** |  Setup inicial GITHUB y SUPABASE|
| **[ROADMAP.md](ROADMAP.md)** | Plan de desarrolo NO ACTUALIZADO |
| **[README.md](README.md)** |  Este archivo - Visión general |
| **[frontend/README-FRONT.md](frontend/README-FRONT.md)** |  Documentación técnica del frontend |
| **[backend//README-BACK.md](backend/README-BACK.md)** |  Documentación de backend |

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

### TENER AJUSTADO GITHUB
Puedes revisar **[INICIO.md](INICIO.md)** |  Setup inicial GITHUB y SUPABASE| para segurarte.
### **1. Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd dgp
```

### **2. Configurar variables de entorno **
#### Es una mala practica exponern nuestro .env, con todas las variables de entorno en la red. Por lo que envio .env.example.  
### Archivos disponibles en:
#### **Backend** (`backend/.env.example`):
#### **Frontend** (`frontend/.env.example`):

### PROCESO
#### Copiar el contenido de .env.example en un archivo .env en el mismo directorio y rellenerlo conforme se dice en el archivo. Así conseguimos sincronizar el proyecto.



### **3. Instalar dependencias**

Para el backend usamos un entorno virtual de python3, por lo que estas dependencias son solamente para este proyecto y no genera problemas.  

Para el front se aisla dependencias automaticamente en node_modules.

```bash
# Backend (Python)
python3 -m venv .venv
source .venv/bin/activate  
cd backend
pip install -r requirements.txt
cd ..

# Frontend (Node.js)
cd frontend
npm install
cd ..
```

### **4. Configurar la base de datos (YA HECHO ver en supabase)**

Ejecutar los scripts SQL **en orden** en el SQL Editor de Supabase:

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
9. 9_initial_data.sql       # Datos iniciales (4 juegos + estudiante de prueba)
```

> **Detalle:** Ver [`backend/database/README.md`](backend/database/README.md) para más información.

### **5. Iniciar la aplicación**

#### **Opción A: Iniciar ambos servidores con un solo comando** 
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


##  Archivos Clave

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


##  Comandos Útiles

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

##  Recursos Externos

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Docs:** https://react.dev
- **Ionic React:** https://ionicframework.com/docs/react
- **Supabase Docs:** https://supabase.com/docs
- **Axios:** https://axios-http.com/
- **Pydantic:** https://docs.pydantic.dev/



##  Licencia

MIT License.

---

##  Contacto

**Equipo TatoMaths** - Quinternions+1

---

**Última actualización:** 2025-01-13
**Versión:** 1.0.0
**Estado:**  Infraestructura completa - En desarrollo activo
