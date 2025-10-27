-- =====================================================
-- SCRIPT 02: USUARIOS Y ROLES
-- =====================================================
-- Tablas para administradores y tutores

-- Extensión de perfil para usuarios (administradores y tutores)
-- Complementa la tabla auth.users de Supabase
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE, -- Nombre de usuario para login
    role user_role NOT NULL DEFAULT 'tutor',
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,

    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT check_username_length CHECK (char_length(username) >= 3),
    CONSTRAINT check_username_format CHECK (username ~* '^[A-Za-z0-9_-]+$')
);

-- Índices para búsqueda rápida
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- Comentarios
COMMENT ON TABLE user_profiles IS 'Perfiles extendidos de usuarios (administradores y tutores)';
COMMENT ON COLUMN user_profiles.id IS 'ID del usuario, referencia a auth.users';
COMMENT ON COLUMN user_profiles.username IS 'Nombre de usuario para login (mínimo 3 caracteres, alfanumérico con guiones)';
COMMENT ON COLUMN user_profiles.role IS 'Rol del usuario: admin o tutor';
