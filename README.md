<div align="center">

# TATO MATEMÁTICAS 2

### Plataforma Educativa de Matemáticas Accesibles

*Aprendizaje inclusivo mediante juegos interactivos personalizables*

---

**Universidad de Granada** • Diseño y Gestión de Proyectos
Desarrollado por **Quinternions+1**

</div>

---

## Descripción

TATO MATEMÁTICAS 2 es una aplicación web educativa que facilita el aprendizaje de matemáticas básicas mediante juegos personalizables. El proyecto está orientado a estudiantes con diversidad funcional, ofreciendo una experiencia adaptada a las necesidades de cada usuario.

**Características principales:**
- 4 juegos matemáticos interactivos
- Personalización completa (colores, audio, pictogramas)
- Sistema de gestión para profesores y administradores
- Login

---

## Usuarios de Prueba

| Rol | Usuario | Contraseña | Tipo |
|:---:|---------|------------|:----:|
| **Administrador** | `admin` | `admin123` | Texto |
| **Profesor** | `profesora` | `profesora123` | Texto |
| **Estudiante** | `ramon` | `ramon123` | Texto |
| **Estudiante** | `manuel` | `perro-gato-tortuga` | Pictogramas |
| **Estudiante** | `pepe` | `1234` | Numérico |


---

## Instalación y Configuración

### Requisitos Previos

```
Node.js 18+  |  Python 3.10+  |  Cuenta Supabase
```

### Pasos de Instalación

**1. Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/tatomaths.git
cd dgp
```

**2. Configurar variables de entorno**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
> Editar ambos archivos con las credenciales de Supabase

**3. Instalar dependencias**
```bash
# Backend (Python)
python3 -m venv .venv
source .venv/bin/activate
cd backend && pip install -r requirements.txt && cd ..

# Frontend (Node)
cd frontend && npm install && cd ..
```

**4. Iniciar aplicación**
```bash
npm run dev
```

**Aplicación disponible en:** http://localhost:5173

---

## Estructura del Proyecto

```
dgp/
├── backend/              # API REST (FastAPI + Python)
│   ├── app/
│   │   ├── routers/      # Endpoints de la API
│   │   ├── services/     # Lógica de negocio
│   │   └── schemas/      # Modelos de datos
│   └── database/         # Scripts SQL
│
├── frontend/             # Interfaz (React + Ionic)
│   ├── src/
│   │   ├── pages/        # Páginas y componentes
│   │   ├── contexts/     # Estado global
│   │   └── lib/          # Utilidades
│   └── public/           # Recursos estáticos
│
└── package.json          # Scripts del proyecto
```

---

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar backend + frontend simultáneamente |
| `npm run dev:backend` | Solo backend (Puerto 8000) |
| `npm run dev:frontend` | Solo frontend (Puerto 5173) |
| `npm run build` | Compilar para producción |

---


<div align="center">

**Universidad de Granada** • 2025
Proyecto DGP - Quinternions+1

</div>
