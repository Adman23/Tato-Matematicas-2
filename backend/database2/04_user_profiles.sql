-- =====================================================
-- SCRIPT 04: USER PROFILES
-- =====================================================
-- Perfiles de configuración para Students y Teachers

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Información básica
    full_name VARCHAR(255), -- Requerido para Student, opcional para Teacher
    notes TEXT,

    -- Configuraciones de accesibilidad (JSON)
    visual_preferences JSONB DEFAULT '{}'::jsonb,
    audio_preferences JSONB DEFAULT '{}'::jsonb,
    accessibility_settings JSONB DEFAULT '{}'::jsonb,
    game_preferences JSONB DEFAULT '{}'::jsonb
);

-- Índice
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Trigger: Crear perfil vacío automáticamente al crear Student o Teacher
CREATE OR REPLACE FUNCTION create_default_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear perfil para Students y Teachers (NO para Admin)
    IF NEW.role IN ('student', 'teacher') THEN
        INSERT INTO user_profiles (
            user_id,
            full_name,
            visual_preferences,
            audio_preferences,
            accessibility_settings,
            game_preferences
        ) VALUES (
            NEW.id,
            CASE
                WHEN NEW.role = 'student' THEN COALESCE(NEW.username, 'Nuevo Estudiante')
                ELSE NULL  -- Teacher no tiene full_name por defecto
            END,
            '{}'::jsonb,
            '{}'::jsonb,
            '{}'::jsonb,
            '{}'::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_profile_on_user_creation
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_profile();

-- Comentarios
COMMENT ON TABLE user_profiles IS 'Perfiles de configuración para Students y Teachers (NO Admin)';
COMMENT ON COLUMN user_profiles.user_id IS 'ID del usuario (FK a users)';
COMMENT ON COLUMN user_profiles.full_name IS '[Student] Nombre completo del estudiante. [Teacher] Opcional para pruebas';
COMMENT ON COLUMN user_profiles.notes IS 'Notas adicionales';
COMMENT ON COLUMN user_profiles.visual_preferences IS 'Preferencias visuales (colores, tamaño fuente, etc.) en JSON';
COMMENT ON COLUMN user_profiles.audio_preferences IS 'Preferencias de audio (volumen, TTS, etc.) en JSON';
COMMENT ON COLUMN user_profiles.accessibility_settings IS 'Configuraciones de accesibilidad (switch control, etc.) en JSON';
COMMENT ON COLUMN user_profiles.game_preferences IS 'Preferencias de juegos (elementos visuales, etc.) en JSON';
