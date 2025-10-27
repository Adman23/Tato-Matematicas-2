-- =====================================================
-- SCRIPT 04: JUEGOS Y CONFIGURACIONES
-- =====================================================

-- Catálogo de juegos disponibles
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type game_type NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    help_video_url TEXT, -- URL del video de ayuda en Storage
    icon_url TEXT,

    CONSTRAINT unique_game_type UNIQUE (game_type)
);

-- Configuración de dificultad por juego y estudiante
CREATE TABLE game_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

    -- Configuración común a todos los juegos
    number_range number_range DEFAULT 'range_0_10',
    repetitions_per_session INTEGER DEFAULT 5 CHECK (repetitions_per_session BETWEEN 1 AND 20),

    -- Configuración específica: Juego 1 (Toca el número que suena)
    touch_number_options_count INTEGER DEFAULT 4 CHECK (touch_number_options_count BETWEEN 1 AND 12),

    -- Configuración específica: Juego 2 (Ordena la secuencia)
    order_sequence_count INTEGER DEFAULT 5 CHECK (order_sequence_count BETWEEN 3 AND 12),
    order_sequence_type order_type DEFAULT 'ascending',

    -- Configuración específica: Juegos 3 y 4 (Recipientes)
    container_object_count INTEGER DEFAULT 8 CHECK (container_object_count IN (4, 8, 12)),
    container_count INTEGER DEFAULT 2 CHECK (container_count BETWEEN 2 AND 4),
    require_operations BOOLEAN DEFAULT FALSE, -- Si requiere sumas/restas
    operation_type operation_type DEFAULT 'none',

    -- Configuración de ayudas
    show_hints BOOLEAN DEFAULT TRUE,
    auto_check_result BOOLEAN DEFAULT TRUE, -- Verificar automáticamente o esperar confirmación
    allow_retry BOOLEAN DEFAULT TRUE,
    max_attempts INTEGER DEFAULT 3 CHECK (max_attempts > 0),

    CONSTRAINT unique_student_game UNIQUE (student_id, game_id)
);

-- Índices
CREATE INDEX idx_games_type ON games(game_type);
CREATE INDEX idx_game_configurations_student ON game_configurations(student_id);
CREATE INDEX idx_game_configurations_game ON game_configurations(game_id);
CREATE INDEX idx_game_configurations_student_game ON game_configurations(student_id, game_id);

-- Función para crear configuraciones por defecto al crear un estudiante
CREATE OR REPLACE FUNCTION create_default_game_configurations()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear configuración por defecto para cada juego
    INSERT INTO game_configurations (student_id, game_id)
    SELECT NEW.id, g.id
    FROM games g;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_game_configs_on_student_creation
    AFTER INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION create_default_game_configurations();

-- Comentarios
COMMENT ON TABLE games IS 'Catálogo de juegos disponibles en la aplicación';
COMMENT ON TABLE game_configurations IS 'Configuración de dificultad por estudiante y juego';

COMMENT ON COLUMN games.game_type IS 'Tipo de juego (identificador único)';
COMMENT ON COLUMN games.help_video_url IS 'URL del video de demostración subtitulado';

COMMENT ON COLUMN game_configurations.number_range IS 'Rango numérico para este juego';
COMMENT ON COLUMN game_configurations.repetitions_per_session IS 'Número de repeticiones por sesión de juego';
COMMENT ON COLUMN game_configurations.touch_number_options_count IS '[Juego 1] Cantidad de números a mostrar como opciones';
COMMENT ON COLUMN game_configurations.order_sequence_count IS '[Juego 2] Cantidad de números a ordenar';
COMMENT ON COLUMN game_configurations.order_sequence_type IS '[Juego 2] Tipo de orden: creciente o decreciente';
COMMENT ON COLUMN game_configurations.container_object_count IS '[Juegos 3 y 4] Cantidad de objetos/bolas que aparecen';
COMMENT ON COLUMN game_configurations.container_count IS '[Juegos 3 y 4] Cantidad de recipientes';
COMMENT ON COLUMN game_configurations.require_operations IS '[Juegos 3 y 4] Si requiere operaciones matemáticas';
COMMENT ON COLUMN game_configurations.operation_type IS '[Juegos 3 y 4] Tipo de operación requerida';
COMMENT ON COLUMN game_configurations.max_attempts IS 'Número máximo de intentos permitidos';
