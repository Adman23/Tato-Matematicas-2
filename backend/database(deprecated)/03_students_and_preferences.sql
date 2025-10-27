-- =====================================================
-- SCRIPT 03: ESTUDIANTES Y PREFERENCIAS
-- =====================================================

-- Tabla de estudiantes
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    photo_url TEXT,
    pin_code VARCHAR(10), -- Para login accesible (puede ser numérico o pictográfico)
    pictogram_login_sequence TEXT[], -- Secuencia de pictogramas para login
    notes TEXT, -- Notas del tutor sobre el estudiante

    CONSTRAINT check_username_length CHECK (char_length(username) >= 3)
);

-- Relación estudiante-tutor (N:M)
CREATE TABLE student_tutor_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE, -- Indica si es el tutor principal

    CONSTRAINT unique_student_tutor UNIQUE (student_id, tutor_id)
);

-- Preferencias de accesibilidad y personalización por estudiante
CREATE TABLE student_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,

    -- Preferencias visuales
    primary_color VARCHAR(7) DEFAULT '#4CAF50', -- Color principal (hex)
    secondary_color VARCHAR(7) DEFAULT '#FFC107', -- Color secundario
    background_color VARCHAR(7) DEFAULT '#FFFFFF',
    text_color VARCHAR(7) DEFAULT '#000000',
    high_contrast BOOLEAN DEFAULT FALSE,

    -- Preferencias de texto
    font_family VARCHAR(100) DEFAULT 'Arial',
    font_size font_size DEFAULT 'large',
    font_weight INTEGER DEFAULT 700 CHECK (font_weight BETWEEN 100 AND 900),

    -- Visualización de números
    number_display_mode number_display_mode DEFAULT 'numeric',
    show_number_text BOOLEAN DEFAULT TRUE, -- Mostrar número escrito
    show_number_pictogram BOOLEAN DEFAULT FALSE,
    show_number_image BOOLEAN DEFAULT FALSE,
    play_number_audio BOOLEAN DEFAULT TRUE,

    -- Configuración de audio
    enable_audio BOOLEAN DEFAULT TRUE,
    audio_volume INTEGER DEFAULT 80 CHECK (audio_volume BETWEEN 0 AND 100),
    use_custom_audios BOOLEAN DEFAULT FALSE, -- Usar audios grabados personalizados
    use_tts BOOLEAN DEFAULT TRUE, -- Usar síntesis de voz
    tts_voice VARCHAR(100) DEFAULT 'es-ES-Standard-A', -- Voz de TTS
    tts_speed DECIMAL(3,2) DEFAULT 1.0 CHECK (tts_speed BETWEEN 0.5 AND 2.0),

    -- Preferencias de elementos visuales
    visual_element_type visual_element_type DEFAULT 'balls_with_numbers',
    container_images_set VARCHAR(100) DEFAULT 'default', -- Set de imágenes de recipientes
    object_images_set VARCHAR(100) DEFAULT 'default', -- Set de imágenes de objetos

    -- Accesibilidad
    auto_read_instructions BOOLEAN DEFAULT TRUE,
    show_visual_feedback BOOLEAN DEFAULT TRUE,
    vibration_enabled BOOLEAN DEFAULT FALSE,
    timeout_seconds INTEGER DEFAULT 300 CHECK (timeout_seconds > 0), -- Tiempo máximo por pantalla

    -- Dispositivos de accesibilidad
    enable_keyboard_navigation BOOLEAN DEFAULT TRUE,
    enable_switch_control BOOLEAN DEFAULT FALSE,
    switch_scan_speed INTEGER DEFAULT 2 CHECK (switch_scan_speed BETWEEN 1 AND 10)
);

-- Mensajes de refuerzo positivo personalizados
CREATE TABLE reinforcement_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    media_type media_type NOT NULL,
    media_url TEXT NOT NULL, -- URL del archivo en Storage
    message_text TEXT, -- Texto opcional del mensaje

    CONSTRAINT check_media_url_not_empty CHECK (char_length(media_url) > 0)
);

-- Índices
CREATE INDEX idx_students_username ON students(username);
CREATE INDEX idx_student_tutor_relations_student ON student_tutor_relations(student_id);
CREATE INDEX idx_student_tutor_relations_tutor ON student_tutor_relations(tutor_id);
CREATE INDEX idx_student_tutor_relations_primary ON student_tutor_relations(is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_student_preferences_student ON student_preferences(student_id);
CREATE INDEX idx_reinforcement_messages_student ON reinforcement_messages(student_id);

-- Función para crear preferencias por defecto al crear un estudiante
CREATE OR REPLACE FUNCTION create_default_student_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO student_preferences (student_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_student_preferences_on_student_creation
    AFTER INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION create_default_student_preferences();

-- Comentarios
COMMENT ON TABLE students IS 'Estudiantes que utilizan la aplicación';
COMMENT ON TABLE student_tutor_relations IS 'Relación N:M entre estudiantes y tutores';
COMMENT ON TABLE student_preferences IS 'Preferencias de accesibilidad y personalización por estudiante';
COMMENT ON TABLE reinforcement_messages IS 'Mensajes de refuerzo positivo personalizados';

COMMENT ON COLUMN students.pin_code IS 'PIN numérico para login accesible';
COMMENT ON COLUMN students.pictogram_login_sequence IS 'Secuencia de IDs de pictogramas para login. Valores: perro, gato, tortuga, pingüino, caballo, león, elefante, periquito, pez payaso, mariquita';
COMMENT ON COLUMN student_preferences.number_display_mode IS 'Modo principal de visualización de números';
COMMENT ON COLUMN student_preferences.visual_element_type IS 'Tipo de elementos visuales en juegos de recipientes';
COMMENT ON COLUMN student_preferences.timeout_seconds IS 'Tiempo máximo en segundos antes de timeout en pantalla';
COMMENT ON COLUMN student_preferences.switch_scan_speed IS 'Velocidad de escaneo para control por conmutadores (1=lento, 10=rápido)';
