# Base de Datos TatoMaths - Database2

Base de datos para la aplicación TatoMaths usando el patrón **TPH (Table Per Hierarchy)** en Supabase/PostgreSQL.

---

## 🔑 Cambio Crítico en la Estructura

### ⚠️ IMPORTANTE: Separación de IDs

La tabla `users` ahora usa **DOS campos distintos** para IDs:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),          -- ID propio de la tabla
    auth_user_id UUID UNIQUE REFERENCES auth.users(id),    -- FK a Supabase Auth
    role user_role NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    photo_url TEXT,
    group_id INTEGER
);
```

### Por qué este cambio?

**Problema anterior:**
- `id` hacía referencia directa a `auth.users(id)`
- Students NO usan Supabase Auth
- Al intentar insertar Students, fallaba porque NO existían en `auth.users`

**Solución actual:**
- **`id`**: UUID autogenerado para TODOS los usuarios (students, teachers, admin)
- **`auth_user_id`**: Solo para Teachers/Admin, apunta a `auth.users`
- Students tienen `auth_user_id = NULL`

---

## 📋 Estructura de Archivos

### Scripts SQL (ejecutar en orden):
1. **00_drop_all.sql** - Limpia todas las tablas
2. **01_enums.sql** - Tipos enumerados (`user_role`)
3. **02_users.sql** - Tabla principal de usuarios (TPH)
4. **03_groups.sql** - Grupos de estudiantes
5. **04_user_profiles.sql** - Perfiles para Students y Teachers
6. **05_teacher_group_relations.sql** - Relación N:M Teachers-Groups
7. **06_games.sql** - Catálogo de juegos (4 juegos)
8. **07_game_configurations.sql** - Configuraciones de dificultad por estudiante
9. **08_game_sessions.sql** - Resultados de sesiones de juego
10. **09_reinforcement_messages.sql** - Mensajes de refuerzo personalizados
11. **99_test_data.sql** - Datos de prueba

### Documentación:
- **REGISTER_USERS.md** ⭐ - Guía completa de registro de usuarios
- **DATABASE_DESIGN.md** - Explicación del diseño y validaciones
- **GAME_SYSTEM_EXPLAINED.md** - Sistema de juegos y configuraciones
- **FILE_MANAGEMENT.md** - Gestión de archivos multimedia
- **README.md** - Este archivo

---

## 🚀 Instalación

### 1. Ejecutar Scripts en Orden

En el **SQL Editor** de Supabase:

```sql
-- 1. Limpiar base de datos (opcional, solo si reseteas)
\i 00_drop_all.sql

-- 2. Crear estructura
\i 01_enums.sql
\i 02_users.sql
\i 03_groups.sql
\i 04_user_profiles.sql
\i 05_teacher_group_relations.sql
\i 06_games.sql
\i 07_game_configurations.sql
\i 08_game_sessions.sql
\i 09_reinforcement_messages.sql

-- 3. Datos de prueba (opcional)
\i 99_test_data.sql
```

O copiar y pegar el contenido de cada archivo uno por uno.

---

## 👥 Tipos de Usuarios

### 📊 Resumen

| Tipo | Autenticación | `id` | `auth_user_id` | `group_id` | `password_hash` |
|------|---------------|------|----------------|------------|-----------------|
| **Student** | Pictogramas | Auto | NULL | NOT NULL | Bcrypt de pictogramas |
| **Teacher** | Supabase Auth | Auto | UUID de auth.users | NULL | Vacío '' |
| **Admin** | Supabase Auth | Auto | UUID de auth.users | NULL | Vacío '' |

### 🔐 Constraints Importantes

```sql
-- Students DEBEN tener group_id
CONSTRAINT check_student_must_have_group CHECK (
    role != 'student' OR (role = 'student' AND group_id IS NOT NULL)
)

-- Teachers/Admin NO pueden tener group_id
CONSTRAINT check_teacher_admin_no_group CHECK (
    role = 'student' OR (role IN ('teacher', 'admin') AND group_id IS NULL)
)

-- Students NO deben tener auth_user_id, Teachers/Admin SÍ
CONSTRAINT check_auth_user_id_by_role CHECK (
    (role = 'student' AND auth_user_id IS NULL) OR
    (role IN ('teacher', 'admin') AND auth_user_id IS NOT NULL)
)
```

---

## 🎮 Juegos

La aplicación incluye 4 juegos matemáticos:

1. **touch_number** - Toca el número que suena
2. **order_sequence** - Ordena la secuencia
3. **distribute_equal** - Reparte el mismo número en cada recipiente
4. **remove_equal** - Deja el mismo número en cada recipiente

Cada juego tiene:
- Configuración de dificultad por estudiante (`game_configurations`)
- Registro de sesiones con resultados (`game_sessions`)

---

## 📝 Cómo Registrar Usuarios

### ✅ Estudiantes (Students)

```sql
-- Insertar directamente (NO necesitan estar en auth.users)
INSERT INTO users (role, username, password_hash, photo_url, group_id)
VALUES (
    'student',
    'juan_perez',
    crypt('perro-gato-leon', gen_salt('bf')),  -- Secuencia de pictogramas
    'https://example.com/juan.jpg',
    1  -- Grupo A (OBLIGATORIO)
);
```

**Nota:** `id` se genera automáticamente, `auth_user_id` queda NULL.

---

### ✅ Admin / Teachers

**Paso 1:** Crear en Supabase Auth Dashboard
1. Ir a **Authentication → Users**
2. **Add user** → Email
3. Email: `admin@example.com`, Password: `admin123`
4. **Copiar el UUID generado** (ej: `11111111-1111-1111-1111-111111111111`)

**Paso 2:** Insertar en tabla `users`

```sql
INSERT INTO users (auth_user_id, role, username, password_hash, group_id)
VALUES (
    '11111111-1111-1111-1111-111111111111',  -- UUID de auth.users
    'admin',
    'admin',
    '',  -- Vacío
    NULL
);
```

**Nota:** `id` se genera automáticamente.

Para más detalles, ver **[REGISTER_USERS.md](./REGISTER_USERS.md)**.

---

## ⚠️ Errores Comunes

### Error: `violates foreign key constraint "users_auth_user_id_fkey"`

**Causa:** Intentando insertar Admin/Teacher sin crear primero en `auth.users`

**Solución:**
1. Crear usuario en Supabase Auth PRIMERO
2. Copiar UUID
3. Usar ese UUID en `auth_user_id`

---

### Error: `violates check constraint "check_student_must_have_group"`

**Causa:** Student sin `group_id`

**Solución:**
```sql
-- ❌ MAL
INSERT INTO users (role, username, password_hash, group_id)
VALUES ('student', 'juan', 'hash', NULL);

-- ✅ BIEN
INSERT INTO users (role, username, password_hash, group_id)
VALUES ('student', 'juan', crypt('perro-gato', gen_salt('bf')), 1);
```

---

### Error: `violates check constraint "check_auth_user_id_by_role"`

**Causa:**
- Student con `auth_user_id` (debe ser NULL)
- Teacher/Admin sin `auth_user_id` (debe ser NOT NULL)

**Solución:**
```sql
-- ❌ MAL - Student con auth_user_id
INSERT INTO users (auth_user_id, role, username, password_hash, group_id)
VALUES ('uuid-here', 'student', 'juan', 'hash', 1);

-- ✅ BIEN - Student sin auth_user_id
INSERT INTO users (role, username, password_hash, group_id)
VALUES ('student', 'juan', crypt('perro-gato', gen_salt('bf')), 1);
```

---

## 🎯 Flujos de Autenticación

### Login de Admin/Teacher
1. Usuario ingresa email + password en frontend
2. Frontend llama `supabase.auth.signInWithPassword()`
3. Supabase Auth valida credenciales
4. Devuelve JWT token
5. Frontend busca datos en tabla `users` usando `auth_user_id`

### Login de Student
1. Estudiante selecciona grupo
2. Selecciona username de los disponibles
3. Selecciona secuencia de 3 pictogramas
4. Frontend hashea y compara con `password_hash`
5. Si coincide, crea sesión manual (NO usa Supabase Auth)

---

## 🔗 Relaciones Importantes

### Students → Groups (1:N)
- Cada student pertenece a **1 grupo** (`users.group_id`)
- Constraint: `check_student_must_have_group`

### Teachers → Groups (N:M)
- Cada teacher puede tener **múltiples grupos**
- Tabla intermedia: `teacher_group_relations`
- Constraint: `check_teacher_admin_no_group` (Teachers NO tienen `group_id` en `users`)

### Users → User Profiles (1:1)
- Trigger: `create_default_user_profile()`
- Se crea automáticamente para Students Y Teachers (NO Admin)
- Contiene preferencias visuales, audio, accesibilidad, etc.

### Students → Game Configurations (1:N)
- Cada student tiene **4 configuraciones** (una por juego)
- Trigger: `create_default_game_configurations()`
- Se crean automáticamente al insertar student

---

## 📚 Documentación Adicional

- **[REGISTER_USERS.md](./REGISTER_USERS.md)** - Guía completa de registro (con ejemplos TypeScript)
- **[DATABASE_DESIGN.md](./DATABASE_DESIGN.md)** - Decisiones de diseño y validaciones
- **[GAME_SYSTEM_EXPLAINED.md](./GAME_SYSTEM_EXPLAINED.md)** - Sistema de juegos y diferencia entre configuraciones
- **[FILE_MANAGEMENT.md](./FILE_MANAGEMENT.md)** - Cómo gestionar archivos multimedia (Supabase Storage)

---

## 🛠️ Tecnologías

- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos relacional
- **pgcrypto** - Extensión para bcrypt (hash de contraseñas)
- **JSONB** - Almacenamiento flexible de configuraciones
- **Triggers** - Automatización de creación de perfiles y configuraciones

---

## 📦 Extensiones Requeridas

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- Para bcrypt
```

---

## 🎨 Patrón de Diseño: TPH (Table Per Hierarchy)

En lugar de tener tablas separadas `students`, `teachers`, `admins`:

✅ **Una sola tabla `users`** con columna discriminadora `role`
✅ Validaciones mediante constraints
✅ Simplifica queries y relaciones
✅ Menos JOINs necesarios

---

## 🔄 Cómo Resetear la Base de Datos

```sql
-- Ejecutar en SQL Editor
\i 00_drop_all.sql
```

Luego volver a ejecutar scripts 01-09.

---

## 💡 Tips

1. **Siempre crear Admin/Teachers en Supabase Auth PRIMERO**
2. **Students se crean directamente en la BD** (no en Auth)
3. **Usar subqueries en test data** para referencias dinámicas:
   ```sql
   (SELECT id FROM users WHERE username = 'juan_perez')
   ```
4. **Los triggers crean perfiles automáticamente** - no necesitas insertarlos manualmente

---

## 📞 Soporte

Para más información, consulta la documentación en la carpeta `/database2/`.
