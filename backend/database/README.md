# Base de Datos TatoMaths

Documentación de la base de datos PostgreSQL/Supabase para la aplicación **TatoMaths**.

---

## Estructura de Archivos SQL

Los scripts están numerados para ejecutarse en orden secuencial:

| Archivo | Descripción | Obligatorio |
|---------|-------------|-------------|
| `00_drop_all.sql` | Limpia toda la base de datos (úsalo solo para reiniciar) |  Solo si reinicias |
| `01_enums.sql` | Tipos enumerados (roles, juegos, tamaños, etc.) | 
| `02_users_and_roles.sql` | Tabla de usuarios (admins y tutores) | 
| `03_students_and_preferences.sql` | Estudiantes, preferencias, relaciones tutor-estudiante | 
| `04_games_and_configurations.sql` | Catálogo de juegos y configuraciones por estudiante | 
| `05_sessions_and_results.sql` | Sesiones de juego, resultados y estadísticas | 
| `06_media_library.sql` | Biblioteca multimedia (audios, imágenes, videos) | 
| `09_storage_buckets.sql` | Verificación de buckets de Supabase Storage | 
| `07_initial_data.sql` | Datos iniciales: 4 juegos + admin + estudiante de prueba | 

---

## Instalación Rápida

### Paso 1: Limpiar base de datos (opcional)

 **Solo si necesitas empezar desde cero:**

1. Ve a [Supabase Dashboard](https://supabase.com) → SQL Editor
2. Ejecuta `00_drop_all.sql`
3. Espera confirmación

### Paso 2: Crear la base de datos

Ejecuta **en orden** cada archivo en el SQL Editor de Supabase:

```
1️  01_enums.sql               → Define tipos de datos
2️  02_users_and_roles.sql     → Crea tabla user_profiles
3️  03_students_and_preferences.sql → Crea tablas de estudiantes
4️  04_games_and_configurations.sql → Crea tablas de juegos
5️  05_sessions_and_results.sql → Crea tablas de sesiones
6️  06_media_library.sql       → Crea biblioteca multimedia
7️  09_storage_buckets.sql     → Verifica buckets de storage
8️  10_initial_data.sql        → Inserta juegos y usuarios de prueba
```


## Configuración de Storage
Crear buckets manualmente leer: 
## Usuarios de Prueba

El script `07_initial_data.sql` crea automáticamente:

### Admin
- **Email:** `admin@tatomaths.com`
- **UUID:** `00000000-0000-0000-0000-000000000001`
- **Rol:** admin
- **Uso:** Para testing del backend

 **IMPORTANTE:** Este admin tiene un UUID fijo. En producción debes:
1. Crear usuario en **Authentication → Users** en Supabase
2. Modificar el script `07_initial_data.sql` con el UUID real
3. O insertar manualmente tu admin con el UUID de Supabase

### Estudiante

---

## Arquitectura de Seguridad

### Backend-First (SERVICE_ROLE)

Este proyecto usa una arquitectura **backend-first**:

-  El backend FastAPI usa `SUPABASE_SERVICE_ROLE`
-  Toda la seguridad se valida en los endpoints de FastAPI
-  No hay acceso directo desde el frontend a Supabase
-  No se usan políticas RLS (Row Level Security)
-  No se usan políticas de Storage

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

