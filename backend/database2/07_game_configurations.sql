-- =====================================================
-- SCRIPT 07: CONFIGURACIÓN DE JUEGOS POR ESTUDIANTE
-- =====================================================
-- Configuración de dificultad por estudiante y juego

CREATE TABLE game_configurations (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,

    -- Configuración común a todos los juegos
    number_range VARCHAR(20) DEFAULT '0-10', -- '0-10', '0-20', '0-100', '0-1000'

    -- Configuración específica almacenada en JSON
    settings JSONB DEFAULT '{}'::jsonb,

    CONSTRAINT unique_student_game UNIQUE (student_id, game_id)
);

-- Índices
CREATE INDEX idx_game_configurations_student ON game_configurations(student_id);
CREATE INDEX idx_game_configurations_game ON game_configurations(game_id);

-- Trigger: Crear configuraciones por defecto para cada juego al crear un estudiante
CREATE OR REPLACE FUNCTION create_default_game_configurations()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'student' THEN
        -- Crear una configuración por cada juego
        INSERT INTO game_configurations (student_id, game_id, number_range, settings)
        SELECT
            NEW.id,
            g.id,
            '0-10',
            CASE g.key
                WHEN 'touch_number' THEN '{"options_count": 4}'::jsonb
                WHEN 'order_sequence' THEN '{"sequence_count": 5, "order_type": "ascending"}'::jsonb
                WHEN 'distribute_equal' THEN '{"object_count": 8, "container_count": 2, "requires_operations": false}'::jsonb
                WHEN 'remove_equal' THEN '{"object_count": 8, "container_count": 2, "requires_operations": false}'::jsonb
            END
        FROM games g;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_game_configs_on_student_creation
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_game_configurations();

-- Comentarios
COMMENT ON TABLE game_configurations IS 'Configuración de dificultad por estudiante y juego';
COMMENT ON COLUMN game_configurations.student_id IS 'ID del estudiante';
COMMENT ON COLUMN game_configurations.game_id IS 'ID del juego';
COMMENT ON COLUMN game_configurations.number_range IS 'Rango numérico: 0-10, 0-20, 0-100, 0-1000';
COMMENT ON COLUMN game_configurations.settings IS 'Configuración específica del juego en JSON';

-- Ejemplos de settings JSON por juego:
-- touch_number: {"options_count": 4}  (1-12)
-- order_sequence: {"sequence_count": 5, "order_type": "ascending"}  (3-12, ascending/descending)
-- distribute_equal: {"object_count": 8, "container_count": 2, "requires_operations": false}  (4/8/12, 2-4, true/false)
-- remove_equal: {"object_count": 8, "container_count": 2, "requires_operations": false}  (4/8/12, 2-4, true/false)
