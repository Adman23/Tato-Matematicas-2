# Base de Datos TatoMaths

Documentación de la base de datos PostgreSQL/Supabase para la aplicación **TatoMaths**.

---

## Estructura de Archivos SQL

Los scripts están numerados para ejecutarse en orden secuencial:

| Archivo | Descripción | Obligatorio |
|---------|-------------|-------------|
| `00_drop_all.sql` | Limpia toda la base de datos (úsalo solo para reiniciar) | ⚠️ Solo si reinicias |
| `01_enums.sql` | Tipos enumerados (roles, juegos, tamaños, etc.) | ✅ Sí |
| `02_users_and_roles.sql` | Tabla de usuarios (admins y tutores) | ✅ Sí |
| `03_students_and_preferences.sql` | Estudiantes, preferencias, relaciones tutor-estudiante | ✅ Sí |
| `04_games_and_configurations.sql` | Catálogo de juegos y configuraciones por estudiante | ✅ Sí |
| `05_sessions_and_results.sql` | Sesiones de juego, resultados y estadísticas | ✅ Sí |
| `06_media_library.sql` | Biblioteca multimedia (audios, imágenes, videos) | ✅ Sí |
| `09_storage_buckets.sql` | Verificación de buckets de Supabase Storage | ✅ Sí |
| `10_initial_data.sql` | Datos iniciales: 4 juegos + admin + estudiante de prueba | ✅ Sí |

---

## Instalación Rápida

### Paso 1: Limpiar base de datos (opcional)

⚠️ **Solo si necesitas empezar desde cero:**

1. Ve a [Supabase Dashboard](https://supabase.com) → SQL Editor
2. Ejecuta `00_drop_all.sql`
3. Espera confirmación

### Paso 2: Crear la base de datos

Ejecuta **en orden** cada archivo en el SQL Editor de Supabase:

```
1️⃣  01_enums.sql               → Define tipos de datos
2️⃣  02_users_and_roles.sql     → Crea tabla user_profiles
3️⃣  03_students_and_preferences.sql → Crea tablas de estudiantes
4️⃣  04_games_and_configurations.sql → Crea tablas de juegos
5️⃣  05_sessions_and_results.sql → Crea tablas de sesiones
6️⃣  06_media_library.sql       → Crea biblioteca multimedia
7️⃣  09_storage_buckets.sql     → Verifica buckets de storage
8️⃣  10_initial_data.sql        → Inserta juegos y usuarios de prueba
```

**Para cada archivo:**
1. Abre el archivo en tu editor
2. Copia TODO su contenido
3. Pega en Supabase SQL Editor
4. Click en **Run** (o `Ctrl+Enter`)
5. Espera confirmación ✅
6. Continúa con el siguiente

---

## Configuración de Storage

### Crear buckets manualmente

Después de ejecutar los scripts, ve a **Supabase Dashboard → Storage** y crea estos 7 buckets:

| Bucket | Público | Tamaño máx. | MIME types |
|--------|---------|-------------|------------|
| `student-photos` | ❌ No | 5 MB | image/jpeg, image/png, image/webp |
| `custom-audios` | ❌ No | 10 MB | audio/mpeg, audio/wav, audio/ogg, audio/webm |
| `custom-images` | ❌ No | 5 MB | image/jpeg, image/png, image/webp, image/svg+xml |
| `reinforcement-videos` | ❌ No | 50 MB | video/mp4, video/webm, image/gif |
| `game-help-videos` | ✅ Sí | 50 MB | video/mp4, video/webm |
| `pictograms` | ✅ Sí | 2 MB | image/png, image/svg+xml, image/webp |
| `system-assets` | ✅ Sí | 5 MB | image/jpeg, image/png, image/webp, image/svg+xml, audio/mpeg |

**Cómo crear un bucket:**
1. Click en **New Bucket**
2. Introduce el nombre exacto
3. Marca/desmarca **Public** según la tabla
4. Configura límites de tamaño y MIME types
5. Click en **Create**

---

## Usuarios de Prueba

El script `10_initial_data.sql` crea automáticamente:

### Admin
- **Email:** `admin@tatomaths.com`
- **UUID:** `00000000-0000-0000-0000-000000000001`
- **Rol:** admin
- **Uso:** Para testing del backend

⚠️ **IMPORTANTE:** Este admin tiene un UUID fijo. En producción debes:
1. Crear usuario en **Authentication → Users** en Supabase
2. Modificar el script `10_initial_data.sql` con el UUID real
3. O insertar manualmente tu admin con el UUID de Supabase

### Estudiante
- **Username:** `pepito`
- **Nombre completo:** Pepito García
- **Secuencia pictogramas:** 🐶 🐱 🐸 (perro, gato, rana)
- **Uso:** Para testing del login con pictogramas

---

## Arquitectura de Seguridad

### Backend-First (SERVICE_ROLE)

Este proyecto usa una arquitectura **backend-first**:

- ✅ El backend FastAPI usa `SUPABASE_SERVICE_ROLE`
- ✅ Toda la seguridad se valida en los endpoints de FastAPI
- ✅ No hay acceso directo desde el frontend a Supabase
- ❌ No se usan políticas RLS (Row Level Security)
- ❌ No se usan políticas de Storage

**¿Es seguro?** Sí. La seguridad está centralizada en el backend.

**Ejemplo de validación en backend:**
```python
@router.delete("/students/{student_id}")
async def delete_student(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Validar permisos
    if current_user["role"] != "admin":
        raise HTTPException(403, "Solo admins pueden eliminar")

    # Ejecutar acción
    supabase.table("students").delete().eq("id", student_id).execute()
```

---

## Diagrama de Entidades

### Usuarios y Roles
```
user_profiles (admins, tutors)
    ↓
student_tutor_relations ← students
                           ↓
                     student_preferences
```

### Juegos y Sesiones
```
games (4 juegos principales)
    ↓
game_configurations (config por estudiante)
    ↓
game_sessions
    ↓
game_results
```

### Media
```
media_library (recursos del sistema)

students → student_custom_audios
students → student_custom_images
students → reinforcement_messages
```

---

## Funciones SQL Útiles

El script `10_initial_data.sql` crea 3 funciones para consultas complejas:

### 1. `get_student_statistics(student_id)`
Obtiene estadísticas agregadas de todos los juegos de un estudiante.

**Uso desde backend:**
```python
result = supabase.rpc('get_student_statistics', {'p_student_id': student_id}).execute()
```

### 2. `get_student_recent_progress(student_id, days)`
Obtiene progreso de los últimos N días, agrupado por día y juego.

**Uso desde backend:**
```python
result = supabase.rpc('get_student_recent_progress', {
    'p_student_id': student_id,
    'p_days': 7
}).execute()
```

### 3. `get_tutor_students(tutor_id)`
Obtiene lista de estudiantes asignados a un tutor con información resumida.

**Uso desde backend:**
```python
result = supabase.rpc('get_tutor_students', {'p_tutor_id': tutor_id}).execute()
```

---

## Datos Iniciales Incluidos

### 4 Juegos
1. **Toca el número que suena** (`touch_number`)
2. **Ordena la secuencia** (`order_sequence`)
3. **Reparte el mismo número** (`distribute_equal`)
4. **Deja el mismo número** (`remove_equal`)

### Preferencias por Defecto
Al crear un estudiante, automáticamente se crean sus preferencias con:
- Tamaño de fuente: medium
- Contraste alto: desactivado
- Audio automático: activado
- Texto a voz: activado
- Texto de apoyo: activado
- Límite de tiempo: desactivado

Esto se hace con un **trigger automático**.

---

## Verificación del Setup

Después de ejecutar todos los scripts, verifica que todo funciona:

### Verificar tablas creadas
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver 12 tablas.

### Verificar juegos insertados
```sql
SELECT game_type, name FROM games;
```

Deberías ver 4 juegos.

### Verificar admin de prueba
```sql
SELECT id, role, full_name, email FROM user_profiles;
```

Deberías ver el admin con email `admin@tatomaths.com`.

### Verificar estudiante de prueba
```sql
SELECT username, full_name, pictogram_login_sequence FROM students;
```

Deberías ver a Pepito con su secuencia 🐶🐱🐸.

### Verificar buckets de storage
```sql
SELECT id, name, public FROM storage.buckets;
```

Deberías ver los 7 buckets creados manualmente.

---

## Troubleshooting

### Error: "relation already exists"
- **Causa:** Estás ejecutando los scripts dos veces
- **Solución:** Ejecuta `00_drop_all.sql` primero para limpiar

### Falta algún bucket
- **Causa:** Los buckets se crean manualmente, no automáticamente
- **Solución:** Ve a Storage y créalos según la tabla de arriba

### El trigger no crea preferencias
- **Causa:** El script `03_students_and_preferences.sql` no se ejecutó completo
- **Solución:** Verifica que el trigger existe:
```sql
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'students';
```

---

## Próximos Pasos

Una vez completada la instalación:

1. ✅ Configura las variables de entorno del backend
2. ✅ Prueba la conexión desde FastAPI
3. ✅ Implementa los endpoints CRUD
4. ✅ Sube recursos multimedia a los buckets
5. ✅ Configura videos de ayuda de juegos

---

**Última actualización:** 2025-01-13
**Versión:** 1.0 (simplificada, sin RLS)
