#  Guía de Inicio - TatoMaths

Esta guía explica cómo subir el proyecto a GitHub y como se puede  descargar, ejecutar y trabajar en ramas. Abajo hay un tutorial completo para trabajar si ko quieres leer tanto.

---
## Parte 0 : ACCESO A SUPABASE:

Ve a: https://supabase.com/dashboard/org/zivtwzmylgxtgzmflinh  

user: quinternions@gmail.com
contraseña:quinternions.5A

##  Parte 2: RAMAS GITHUB
###  Colaboración

---

### **Paso 1: Clonar el repositorio Si no lo has hecho ya **

Abre una terminal y ejecuta:

```bash
# Clonar el proyecto (CAMBIA la URL por la del repositorio)
git clone https://github.com/TU-USUARIO/tatomaths.git

# Entrar a la carpeta
cd tatomaths


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

