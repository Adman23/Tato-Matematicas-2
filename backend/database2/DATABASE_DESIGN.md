# Diseño de Base de Datos - Explicación

## 🤔 ¿Por qué 2 formas diferentes de relacionar con Groups?

### 1️⃣ **Student → Group**: Foreign Key directa

```
students ────────► groups
   (N)       N:1     (1)
```

**Por qué así:**
- ✅ Un estudiante pertenece a **UN SOLO grupo**
- ✅ Relación simple (N:1 o muchos a uno)
- ✅ No necesita tabla intermedia
- ✅ Más eficiente: FK directa en `users.group_id`

**Código:**
```sql
CREATE TABLE users (
    ...
    group_id INTEGER,  -- FK directa

    -- Validación: Student DEBE tener group_id
    CONSTRAINT check_student_must_have_group CHECK (
        role != 'student' OR (role = 'student' AND group_id IS NOT NULL)
    )
);
```

---

### 2️⃣ **Teacher ↔ Group**: Tabla intermedia (N:M)

```
teachers ◄────► teacher_group_relations ◄────► groups
   (N)      N:M           (tabla)          N:M     (M)
```

**Por qué así:**
- ✅ Un tutor puede estar en **MÚLTIPLES grupos** (ej: María enseña Grupo A, B y C)
- ✅ Un grupo puede tener **MÚLTIPLES tutores** (ej: Grupo A tiene María, Pedro y Ana)
- ✅ Relación compleja (N:M o muchos a muchos)
- ✅ **Requiere tabla intermedia** para gestionar la relación

**Código:**
```sql
CREATE TABLE teacher_group_relations (
    id SERIAL PRIMARY KEY,
    teacher_id UUID NOT NULL,  -- FK a users (teacher)
    group_id INTEGER NOT NULL,  -- FK a groups

    CONSTRAINT unique_teacher_group UNIQUE (teacher_id, group_id)
);
```

---

## 📊 Diagrama Completo

```
┌─────────────────────────────────────────┐
│              USERS (TPH)                │
├─────────────────────────────────────────┤
│ id: UUID                                │
│ role: user_role (student|teacher|admin) │
│ username                                │
│ password_hash                           │
│ photo_url                               │
│ group_id: INTEGER                       │
└────────────┬────────────────────────────┘
             │
   ┌─────────┴─────────┐
   │                   │
   │ role='student'    │ role='teacher'
   │ group_id NOT NULL │ group_id NULL
   │                   │
   ▼                   ▼
┌──────────┐    ┌─────────────────────────┐
│ GROUPS   │◄───┤ TEACHER_GROUP_RELATIONS │
├──────────┤    ├─────────────────────────┤
│ id       │    │ id                      │
│ alias    │    │ teacher_id (FK users)   │
└──────────┘    │ group_id (FK groups)    │
   ▲            └─────────────────────────┘
   │
   │ FK directa
   │
   │ (via users.group_id)
   │
   │ Solo para Students
```

---

## ✅ Validaciones Implementadas

### 1. En tabla `users`:

```sql
-- Validación 1: Student DEBE tener group_id
CONSTRAINT check_student_must_have_group CHECK (
    role != 'student' OR (role = 'student' AND group_id IS NOT NULL)
)

-- Validación 2: Teacher/Admin NO pueden tener group_id
CONSTRAINT check_teacher_admin_no_group CHECK (
    role = 'student' OR (role IN ('teacher', 'admin') AND group_id IS NULL)
)
```

**Qué validan:**
- ❌ No puedes crear un Student sin `group_id`
- ❌ No puedes asignar `group_id` a un Teacher o Admin

---

### 2. En tabla `teacher_group_relations`:

```sql
-- Trigger: Solo teachers pueden estar en esta tabla
CREATE OR REPLACE FUNCTION validate_teacher_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.teacher_id AND role = 'teacher'
    ) THEN
        RAISE EXCEPTION 'Solo usuarios con rol teacher pueden estar en teacher_group_relations';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Qué valida:**
- ❌ No puedes insertar un Student o Admin en `teacher_group_relations`
- ✅ Solo Teachers pueden estar en esta tabla

---

## 🧪 Pruebas de Validación

### ✅ CORRECTO: Crear Student con grupo

```sql
INSERT INTO users (id, role, username, password_hash, group_id)
VALUES (
    gen_random_uuid(),
    'student',
    'juan_perez',
    crypt('perro-gato-leon', gen_salt('bf')),
    1  -- ✅ group_id requerido
);
```

### ❌ ERROR: Crear Student sin grupo

```sql
INSERT INTO users (id, role, username, password_hash, group_id)
VALUES (
    gen_random_uuid(),
    'student',
    'maria_lopez',
    crypt('gato-perro-leon', gen_salt('bf')),
    NULL  -- ❌ ERROR: Student debe tener group_id
);

-- ERROR: new row for relation "users" violates check constraint "check_student_must_have_group"
```

### ✅ CORRECTO: Crear Teacher sin grupo

```sql
INSERT INTO users (id, role, username, password_hash, group_id)
VALUES (
    auth.uid(),
    'teacher',
    'pedro_gomez',
    '',
    NULL  -- ✅ Teacher NO debe tener group_id
);
```

### ❌ ERROR: Crear Teacher con grupo

```sql
INSERT INTO users (id, role, username, password_hash, group_id)
VALUES (
    auth.uid(),
    'teacher',
    'ana_ruiz',
    '',
    1  -- ❌ ERROR: Teacher NO puede tener group_id
);

-- ERROR: new row for relation "users" violates check constraint "check_teacher_admin_no_group"
```

### ✅ CORRECTO: Asignar Teacher a grupo

```sql
INSERT INTO teacher_group_relations (teacher_id, group_id)
VALUES ('...teacher_uuid...', 1);  -- ✅ Correcto
```

### ❌ ERROR: Asignar Student a teacher_group_relations

```sql
INSERT INTO teacher_group_relations (teacher_id, group_id)
VALUES ('...student_uuid...', 1);  -- ❌ ERROR

-- ERROR: Solo usuarios con rol teacher pueden estar en teacher_group_relations
```

---

## 🎯 Resumen de Diseño

| Tipo | Relación con Group | Implementación | Cardinalidad |
|------|-------------------|----------------|--------------|
| **Student** | FK directa (`users.group_id`) | Columna en `users` | N:1 (muchos estudiantes → 1 grupo) |
| **Teacher** | Tabla intermedia | `teacher_group_relations` | N:M (muchos tutores ↔ muchos grupos) |
| **Admin** | Sin relación | `group_id` = NULL | - |

---

## 💡 ¿Por qué es lo normal?

Este diseño es **estándar en bases de datos relacionales**:

1. **FK directa para relaciones 1:N** (Student → Group)
   - Más simple
   - Más eficiente
   - Menos queries

2. **Tabla intermedia para relaciones N:M** (Teacher ↔ Group)
   - Flexible
   - Escalable
   - Permite múltiples relaciones

3. **Constraints y Triggers** para validar lógica de negocio
   - Integridad de datos
   - Previene errores
   - Documenta reglas

---

## 📚 Ejemplos de Uso

### Consultar estudiantes de un grupo

```sql
-- Simple: FK directa
SELECT * FROM users
WHERE role = 'student' AND group_id = 1;
```

### Consultar tutores de un grupo

```sql
-- Requiere JOIN: tabla intermedia
SELECT u.*
FROM users u
JOIN teacher_group_relations tgr ON u.id = tgr.teacher_id
WHERE tgr.group_id = 1;
```

### Consultar grupos de un tutor

```sql
SELECT g.*
FROM groups g
JOIN teacher_group_relations tgr ON g.id = tgr.group_id
WHERE tgr.teacher_id = '...teacher_uuid...';
```

### Consultar estudiantes de un tutor

```sql
-- Combinar ambas relaciones
SELECT DISTINCT u.*
FROM users u
JOIN teacher_group_relations tgr ON u.group_id = tgr.group_id
WHERE tgr.teacher_id = '...teacher_uuid...'
  AND u.role = 'student'
ORDER BY u.username;
```

---

## ✅ Ventajas de este Diseño

1. ✅ **Normalizado**: Sin redundancia de datos
2. ✅ **Eficiente**: FK directa para relaciones simples
3. ✅ **Flexible**: Tabla intermedia para relaciones complejas
4. ✅ **Validado**: Constraints y triggers previenen errores
5. ✅ **Escalable**: Fácil agregar más tutores o estudiantes
6. ✅ **Mantenible**: Estructura clara y documentada

---

## 🚀 Conclusión

Este diseño es **estándar y óptimo** para tu caso de uso:

- Students tienen **1 grupo** → FK directa
- Teachers tienen **N grupos** → Tabla intermedia
- Validaciones previenen uso incorrecto
- Queries son eficientes y claras

¡Es exactamente como debe ser! 🎯
