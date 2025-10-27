-- =====================================================
-- SCRIPT 02: TABLA DE USUARIOS - PATRÓN TPH SIMPLIFICADO
-- =====================================================
-- Una sola tabla para Student, Teacher y Admin

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE, -- Solo para Teacher/Admin
    role user_role NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    photo_url TEXT,
    group_id INTEGER, -- FK a groups (Student: requerido, Teacher/Admin: NULL)

    -- Validaciones según el rol
    CONSTRAINT check_student_must_have_group CHECK (
        role != 'student' OR (role = 'student' AND group_id IS NOT NULL)
    ),
    CONSTRAINT check_teacher_admin_no_group CHECK (
        role = 'student' OR (role IN ('teacher', 'admin') AND group_id IS NULL)
    ),
    -- Teacher/Admin deben tener auth_user_id, Student NO debe tenerlo
    CONSTRAINT check_auth_user_id_by_role CHECK (
        (role = 'student' AND auth_user_id IS NULL) OR
        (role IN ('teacher', 'admin') AND auth_user_id IS NOT NULL)
    )
);

-- Índices básicos
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_group_id ON users(group_id);

-- Comentarios
COMMENT ON TABLE users IS 'Tabla única para todos los usuarios (TPH: Student, Teacher, Admin)';
COMMENT ON COLUMN users.role IS 'Tipo de usuario: student, teacher o admin';
COMMENT ON COLUMN users.username IS 'Nombre de usuario único';
COMMENT ON COLUMN users.auth_user_id IS 'ID de auth.users. Solo para Teacher/Admin. Student: NULL';
COMMENT ON COLUMN users.password_hash IS 'Hash de contraseña. Student: pictogramas hasheados con bcrypt. Teacher/Admin: valor vacío (autentican vía Supabase Auth)';
COMMENT ON COLUMN users.photo_url IS 'URL de la foto del usuario';
COMMENT ON COLUMN users.group_id IS 'ID del grupo. Student: requerido. Teacher/Admin: NULL';
