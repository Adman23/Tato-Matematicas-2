# Cómo Registrar Usuarios

Esta guía explica cómo crear usuarios Admin, Teachers y Students correctamente.

---

## 🔐 Importante: Diferencia CRÍTICA en la Estructura

### **Tabla `users` - Estructura**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- UUID autogenerado
    auth_user_id UUID UNIQUE REFERENCES auth.users(id),  -- Solo para Teacher/Admin
    role user_role NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    photo_url TEXT,
    group_id INTEGER
);
```

### **Admin y Teacher**
- ✅ `id` → UUID autogenerado (gen_random_uuid())
- ✅ `auth_user_id` → Apunta al UUID de `auth.users` (Supabase Auth)
- ✅ `password_hash` → Vacío (autenticación vía Supabase Auth)
- ✅ `group_id` → NULL (NO pertenecen a un grupo)

### **Student**
- ✅ `id` → UUID autogenerado (gen_random_uuid())
- ✅ `auth_user_id` → NULL (NO usan Supabase Auth)
- ✅ `password_hash` → Hash bcrypt de secuencia de pictogramas
- ✅ `group_id` → NOT NULL (DEBEN pertenecer a un grupo)

---

## 👨‍💼 Registrar Admin o Teacher

### Opción 1: Desde el Dashboard de Supabase

1. **Ir a Authentication → Users**
2. **Add user** → Email
3. Ingresar:
   - Email: `admin@example.com`
   - Password: `admin123`
   - Auto Confirm User: ✅ (activado)
4. **Copiar el UUID generado** (ej: `11111111-1111-1111-1111-111111111111`)
5. **Ir a SQL Editor** y ejecutar:

```sql
-- Para Admin
INSERT INTO users (auth_user_id, role, username, password_hash, group_id)
VALUES (
    '11111111-1111-1111-1111-111111111111', -- UUID de auth.users
    'admin',
    'admin',
    '',  -- Vacío porque se gestiona por Supabase Auth
    NULL
);
```

```sql
-- Para Teacher
INSERT INTO users (auth_user_id, role, username, password_hash, photo_url, group_id)
VALUES (
    '22222222-2222-2222-2222-222222222222', -- UUID de auth.users
    'teacher',
    'maria_lopez',
    '',  -- Vacío porque se gestiona por Supabase Auth
    'https://example.com/maria.jpg',
    NULL
);
```

**NOTA:** El campo `id` se generará automáticamente con `gen_random_uuid()`.

---

### Opción 2: Desde el Backend (TypeScript)

```typescript
// 1. Registrar en Supabase Auth
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: 'admin@example.com',
  password: 'admin123'
});

if (authError) {
  console.error('Error al registrar en Auth:', authError);
  return;
}

const authUserId = authData.user?.id;

// 2. Insertar en tabla users (id se genera automáticamente)
const { error: dbError } = await supabase
  .from('users')
  .insert({
    auth_user_id: authUserId,  // Apunta a auth.users
    role: 'admin',  // o 'teacher'
    username: 'admin',
    password_hash: '',  // Vacío
    group_id: null
  });

if (dbError) {
  console.error('Error al insertar en users:', dbError);
}
```

---

### Opción 3: Con función RPC (Recomendado)

Crea una función en Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION create_teacher_or_admin(
  p_email TEXT,
  p_password TEXT,
  p_role user_role,
  p_username TEXT,
  p_photo_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_new_user_id UUID;
BEGIN
  -- 1. Crear usuario en auth.users (esto lo hace Supabase internamente)
  -- Este paso requiere usar la API de Auth de Supabase desde el backend

  -- 2. Insertar en users (asumiendo que ya tienes el auth_user_id)
  INSERT INTO users (auth_user_id, role, username, password_hash, photo_url, group_id)
  VALUES (v_auth_user_id, p_role, p_username, '', NULL)
  RETURNING id INTO v_new_user_id;

  RETURN v_new_user_id;
END;
$$;
```

**Nota:** La creación en `auth.users` debe hacerse desde el backend con `supabase.auth.admin.createUser()` si usas Service Key.

---

## 👨‍🎓 Registrar Student

Los estudiantes **NO usan Supabase Auth**. Se crean directamente en la base de datos.

### Opción 1: Desde SQL Editor

```sql
-- Activar extensión pgcrypto si no está activada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insertar estudiante (id se genera automáticamente)
INSERT INTO users (role, username, password_hash, photo_url, group_id)
VALUES (
    'student',
    'juan_perez',
    crypt('perro-gato-leon', gen_salt('bf')),  -- Secuencia de pictogramas
    'https://example.com/juan.jpg',
    1  -- Grupo A (REQUERIDO)
);
```

**NOTA:**
- `id` se genera automáticamente
- `auth_user_id` queda NULL automáticamente
- `group_id` es OBLIGATORIO para students

---

### Opción 2: Desde el Backend (TypeScript)

```typescript
import bcrypt from 'bcrypt';

// 1. Hashear la secuencia de pictogramas
const pictogramSequence = 'perro-gato-leon';
const saltRounds = 10;
const passwordHash = await bcrypt.hash(pictogramSequence, saltRounds);

// 2. Insertar directamente en users (NO en auth.users)
const { data, error } = await supabase
  .from('users')
  .insert({
    // id: NO lo incluimos, se genera automáticamente
    // auth_user_id: NO lo incluimos, queda NULL
    role: 'student',
    username: 'juan_perez',
    password_hash: passwordHash,
    photo_url: 'https://example.com/juan.jpg',
    group_id: 1  // REQUERIDO
  })
  .select();  // Para obtener el id generado

if (error) {
  console.error('Error al crear estudiante:', error);
  return;
}

console.log('Estudiante creado con ID:', data[0].id);
```

---

### Opción 3: Con función RPC

```sql
CREATE OR REPLACE FUNCTION create_student(
  p_username TEXT,
  p_pictogram_sequence TEXT,
  p_photo_url TEXT,
  p_group_id INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_user_id UUID;
BEGIN
  INSERT INTO users (role, username, password_hash, photo_url, group_id)
  VALUES (
    'student',
    p_username,
    crypt(p_pictogram_sequence, gen_salt('bf')),
    p_photo_url,
    p_group_id
  )
  RETURNING id INTO v_new_user_id;

  RETURN v_new_user_id;
END;
$$;
```

Usar desde TypeScript:

```typescript
const { data, error } = await supabase
  .rpc('create_student', {
    p_username: 'juan_perez',
    p_pictogram_sequence: 'perro-gato-leon',
    p_photo_url: 'https://example.com/juan.jpg',
    p_group_id: 1
  });

if (error) {
  console.error('Error:', error);
} else {
  console.log('Estudiante creado con ID:', data);
}
```

---

## 🔍 Verificar Login de Student

```sql
-- Verificar si la secuencia de pictogramas es correcta
SELECT
    id,
    username,
    role,
    group_id,
    (password_hash = crypt('perro-gato-leon', password_hash)) AS password_correct
FROM users
WHERE username = 'juan_perez' AND role = 'student';
```

Desde TypeScript:

```typescript
// 1. Buscar el estudiante
const { data: student, error } = await supabase
  .from('users')
  .select('id, username, password_hash, group_id')
  .eq('username', 'juan_perez')
  .eq('role', 'student')
  .single();

if (error || !student) {
  console.error('Estudiante no encontrado');
  return;
}

// 2. Verificar la secuencia de pictogramas con bcrypt
const isValid = await bcrypt.compare('perro-gato-leon', student.password_hash);

if (isValid) {
  console.log('Login exitoso!');
  // Guardar sesión del estudiante (NO usar Supabase Auth)
} else {
  console.log('Secuencia incorrecta');
}
```

---

## ⚠️ Errores Comunes

### Error: `violates foreign key constraint "users_auth_user_id_fkey"`
**Causa:** Intentando insertar Admin/Teacher sin crear primero en `auth.users`

**Solución:**
1. Crear usuario en Supabase Auth dashboard/API primero
2. Copiar el UUID
3. Usar ese UUID en `auth_user_id`

---

### Error: `new row violates check constraint "check_student_must_have_group"`
**Causa:** Intentando crear un Student sin `group_id`

**Solución:** Siempre proporcionar `group_id` para students:
```sql
INSERT INTO users (role, username, password_hash, group_id)
VALUES ('student', 'juan', crypt('perro-gato', gen_salt('bf')), 1);  -- ✅
```

---

### Error: `new row violates check constraint "check_auth_user_id_by_role"`
**Causa:**
- Student tiene `auth_user_id` (debe ser NULL)
- Teacher/Admin no tiene `auth_user_id` (debe ser NOT NULL)

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

## 📊 Resumen de Campos

| Campo | Student | Teacher/Admin |
|-------|---------|---------------|
| `id` | Auto (gen_random_uuid()) | Auto (gen_random_uuid()) |
| `auth_user_id` | NULL | UUID de auth.users |
| `role` | 'student' | 'teacher' o 'admin' |
| `username` | Requerido | Requerido |
| `password_hash` | Hash bcrypt pictogramas | Vacío '' |
| `photo_url` | Opcional | Opcional |
| `group_id` | NOT NULL (requerido) | NULL |

---

## 🎯 Flujo Completo de Autenticación

### Login de Admin/Teacher
1. Usuario ingresa email + password en frontend
2. Frontend llama a `supabase.auth.signInWithPassword()`
3. Supabase Auth valida credenciales
4. Si válido, devuelve JWT token + user data
5. Frontend busca datos adicionales en tabla `users` usando `auth_user_id`

### Login de Student
1. Estudiante selecciona grupo
2. Selecciona su username de los disponibles en ese grupo
3. Selecciona secuencia de 3 pictogramas
4. Frontend hashea secuencia y compara con `password_hash` en BD
5. Si coincide, crea sesión manual (NO usa Supabase Auth)
