#  Guía de Inicio - TatoMaths

Esta guía explica cómo subir el proyecto a GitHub y cómo tus compañeros pueden descargarlo y ejecutarlo.

---
## Parte 0 : ACCESO A SUPABASE:

Ve a: https://supabase.com/dashboard/org/zivtwzmylgxtgzmflinh  

user: quinternions@gmail.com
contraseña:quinternions.5A

##  Parte 1: Subir el Proyecto a GitHub (Solo tú)

### **Paso 1: Crear repositorio en GitHub**

1. Ve a https://github.com
2. Haz clic en el botón **"New"** (o el símbolo +)
3. Rellena los datos:
   - **Repository name:** `tatomaths` (o el nombre que quieras)
   - **Description:** `Juegos matemáticos accesibles - Proyecto DGP`
   - **Visibilidad:** Private o Public (según prefieras)
   -  **NO marques** "Add a README file"
   -  **NO marques** "Add .gitignore"
4. Haz clic en **"Create repository"**

### **Paso 2: Preparar el proyecto localmente**

Abre una terminal en la carpeta del proyecto (`dgp/`) y ejecuta:

```bash
# 1. Inicializar Git (si no lo has hecho ya)
git init

# 2. Añadir todos los archivos
git add .

# 3. Hacer el primer commit
git commit -m "Initial commit: Proyecto TatoMaths base"

# 4. Renombrar rama principal a 'main'
git branch -M main

# 5. Conectar con GitHub (CAMBIA la URL por la de TU repositorio)
git remote add origin https://github.com/TU-USUARIO/tatomaths.git

# 6. Subir el código a GitHub
git push -u origin main
```

> **Nota:** Reemplaza `TU-USUARIO/tatomaths.git` con la URL que te dio GitHub.

### **Paso 3: Compartir el repositorio**

1. Ve a tu repositorio en GitHub
2. Haz clic en **"Settings"** → **"Collaborators"**
3. Añade a tus compañeros usando su nombre de usuario o email de GitHub
4. Compárteles el enlace del repositorio: `https://github.com/TU-USUARIO/tatomaths`

---

##  Parte 2: Descargar y Ejecutar el Proyecto (Tus compañeros)

### **Requisitos Previos**

Antes de empezar, asegúrate de tener instalado:

- ✅ **Git** → https://git-scm.com/downloads
- ✅ **Python 3.10+** → https://www.python.org/downloads/
- ✅ **Node.js 18+** → https://nodejs.org/

**Verificar instalación:**
```bash
git --version
python3 --version
node --version
npm --version
```

---

### **Paso 1: Clonar el repositorio**

Abre una terminal y ejecuta:

```bash
# Clonar el proyecto (CAMBIA la URL por la del repositorio)
git clone https://github.com/TU-USUARIO/tatomaths.git

# Entrar a la carpeta
cd tatomaths
```

---

### **Paso 2: Configurar variables de entorno**

#### **Backend** (`backend/.env`):
Crea el archivo `backend/.env` con este contenido:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE=tu-service-role-key
ALLOWED_ORIGINS=http://localhost:5173
```

> **Nota:** Pide las claves de Supabase al dueño del proyecto.

#### **Frontend** (`frontend/.env`):
Crea el archivo `frontend/.env` con este contenido:

```env
VITE_API_URL=http://localhost:8000
```

---

### **Paso 3: Instalar dependencias**

```bash
# 1. Crear entorno virtual de Python
python3 -m venv .venv

# 2. Activar el entorno virtual
# En Linux/Mac:
source .venv/bin/activate
# En Windows:
.venv\Scripts\activate

# 3. Instalar dependencias de Python
cd backend
pip install -r requirements.txt
cd ..

# 4. Instalar dependencias de Node.js
cd frontend
npm install
cd ..
```

---

### **Paso 4: Configurar la base de datos (YA HECHO)**

**Solo una persona del equipo debe hacer esto** (o todos usando la misma cuenta de Supabase):

1. Ve a https://supabase.com
2. Crea un proyecto nuevo (o usa el existente)
3. Ve a **SQL Editor**
4. Ejecuta los scripts **en orden** (uno por uno):

```
backend/database/01_enums.sql
backend/database/02_users_and_roles.sql
backend/database/03_students_and_preferences.sql
backend/database/04_games_and_configurations.sql
backend/database/05_sessions_and_results.sql
backend/database/06_media_library.sql
backend/database/09_storage_buckets.sql
backend/database/10_initial_data.sql
```

> **Importante:** Si necesitas reiniciar la BD, ejecuta primero `00_drop_all.sql`.

---

### **Paso 5: Iniciar la aplicación**

#### **Opción A: Iniciar todo con un comando** ⚡
```bash
npm run dev
```

Esto arranca:
- **Backend:** http://localhost:8000
- **Frontend:** http://localhost:5173

#### **Opción B: Iniciar manualmente** (2 terminales)

**Terminal 1 - Backend:**
```bash
cd backend
source ../.venv/bin/activate  # En Windows: ..\.venv\Scripts\activate
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

### **Paso 6: Probar que funciona**

1. Abre el navegador en http://localhost:5173
2. Deberías ver la página de inicio con 2 botones: **Tutor** y **Estudiante**

**Prueba el login:**
- **Estudiante:** Clic en pictogramas → perro, gato, tortuga → Entrar
- **Tutor/Admin:** Usuario: `admin`, Contraseña: `admin123`

---

## 🔄 Trabajar en Equipo con Ramas

### **¿Por qué usar ramas?**
Las ramas permiten que cada persona trabaje en su funcionalidad sin afectar el código principal. Cuando terminas, unes tu rama a `main`.

---

### **Flujo de trabajo con ramas**

#### **1. Actualizar tu código local**
Antes de empezar SIEMPRE:
```bash
git checkout main
git pull origin main
```

#### **2. Crear una nueva rama para tu tarea**
```bash
# Crear y cambiar a una nueva rama
git checkout -b feature/nombre-de-tu-tarea

# Ejemplos:
git checkout -b feature/login-estudiantes
git checkout -b feature/juego-numeros
git checkout -b fix/error-login
```

**Convención de nombres:**
- `feature/...` → Nueva funcionalidad
- `fix/...` → Arreglar un bug
- `docs/...` → Documentación

#### **3. Trabajar en tu rama**
```bash
# Hacer cambios en el código...

# Ver qué archivos cambiaste
git status

# Añadir archivos modificados
git add .

# Hacer commit
git commit -m "Descripción clara de lo que hiciste"

# Ejemplos de buenos commits:
git commit -m "Añadir login con pictogramas para estudiantes"
git commit -m "Corregir error de validación en formulario"
git commit -m "Actualizar README con instrucciones de instalación"
```

#### **4. Subir tu rama a GitHub**
```bash
git push origin feature/nombre-de-tu-tarea
```

#### **5. Crear Pull Request en GitHub**

1. Ve a GitHub → tu repositorio
2. Verás un mensaje: **"Compare & pull request"** → Haz clic
3. Añade un título descriptivo: "Añadir login de estudiantes"
4. Añade una descripción explicando qué hiciste
5. Haz clic en **"Create pull request"**
6. Espera a que tus compañeros revisen el código
7. Si está todo bien, alguien hará **"Merge"** para unir tu rama a `main`

#### **6. Actualizar tu rama main local**
Después de que tu Pull Request se haya unido:
```bash
# Volver a main
git checkout main

# Actualizar con los cambios de GitHub
git pull origin main

# (Opcional) Borrar tu rama local ya que ya está en main
git branch -d feature/nombre-de-tu-tarea
```

---

### **Comandos rápidos útiles**

```bash
# Ver en qué rama estás
git branch

# Ver todas las ramas (locales y remotas)
git branch -a

# Cambiar de rama
git checkout nombre-rama

# Crear y cambiar a nueva rama en un solo comando
git checkout -b nueva-rama

# Actualizar tu rama con cambios de main
git checkout tu-rama
git merge main

# Ver commits recientes
git log --oneline

# Ver diferencias antes de hacer commit
git diff
```

---

### **Situaciones comunes**

#### **"Tengo cambios sin guardar y quiero cambiar de rama"**
```bash
# Guardar cambios temporalmente
git stash

# Cambiar de rama
git checkout otra-rama

# Recuperar cambios guardados
git stash pop
```

#### **"Mi rama está desactualizada con main"**
```bash
# Estando en tu rama
git checkout tu-rama

# Traer cambios de main
git merge main

# Si hay conflictos, Git te dirá qué archivos tienen problema
# Ábrelos, resuelve los conflictos (busca <<<<<<, ======, >>>>>>)
# Luego:
git add .
git commit -m "Resolver conflictos con main"
```

#### **"Metí la pata y quiero deshacer cambios"**
```bash
# Deshacer cambios NO guardados en un archivo
git checkout -- nombre-archivo

# Deshacer TODOS los cambios NO guardados
git reset --hard

# Deshacer el último commit (pero mantener cambios)
git reset --soft HEAD~1

# Deshacer el último commit (y borrar cambios)
git reset --hard HEAD~1
```

---

### **Flujo completo - Ejemplo práctico**

**Tarea:** Añadir página de perfil de estudiante

```bash
# 1. Actualizar main
git checkout main
git pull origin main

# 2. Crear rama
git checkout -b feature/perfil-estudiante

# 3. Hacer cambios en el código...
# Crear StudentProfile.tsx, etc.

# 4. Guardar cambios
git add .
git commit -m "Añadir página de perfil de estudiante con foto y datos"

# 5. Subir rama a GitHub
git push origin feature/perfil-estudiante

# 6. Ir a GitHub y crear Pull Request

# 7. Esperar revisión y merge

# 8. Actualizar main local
git checkout main
git pull origin main
git branch -d feature/perfil-estudiante
```

---

### **Buenas prácticas:**
- ✅ **Siempre** crea una rama nueva para cada tarea
- ✅ Haz `git pull origin main` ANTES de crear una rama
- ✅ Usa nombres descriptivos en las ramas
- ✅ Haz commits pequeños y frecuentes
- ✅ Escribe mensajes de commit claros
- ✅ Prueba que todo funcione ANTES de hacer push
- ✅ NO trabajes directamente en `main`
- ✅ Revisa el código de tus compañeros en los Pull Requests

---
