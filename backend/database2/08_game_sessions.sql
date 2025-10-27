-- =====================================================
-- SCRIPT 08: SESIONES DE JUEGO Y RESULTADOS
-- =====================================================
-- Registro de partidas jugadas por los estudiantes

CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,

    -- Resultados de la sesión (5 repeticiones)
    results JSONB DEFAULT '[]'::jsonb, -- Array con los 5 resultados

    -- Estadísticas agregadas
    total_correct INTEGER DEFAULT 0,
    total_incorrect INTEGER DEFAULT 0,
    total_omissions INTEGER DEFAULT 0,

    started_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_game_sessions_student ON game_sessions(student_id);
CREATE INDEX idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX idx_game_sessions_started_at ON game_sessions(started_at DESC);

-- Comentarios
COMMENT ON TABLE game_sessions IS 'Sesiones de juego completadas por los estudiantes';
COMMENT ON COLUMN game_sessions.student_id IS 'ID del estudiante que jugó';
COMMENT ON COLUMN game_sessions.game_id IS 'ID del juego jugado';
COMMENT ON COLUMN game_sessions.results IS 'Array JSON con los 5 resultados de cada repetición';
COMMENT ON COLUMN game_sessions.total_correct IS 'Total de respuestas correctas en la sesión';
COMMENT ON COLUMN game_sessions.total_incorrect IS 'Total de respuestas incorrectas';
COMMENT ON COLUMN game_sessions.total_omissions IS 'Total de omisiones (no completadas)';
COMMENT ON COLUMN game_sessions.started_at IS 'Fecha y hora de inicio de la sesión';

-- Ejemplo de results JSON:
-- [
--   {"repetition": 1, "correct": true, "attempts": 1, "duration_seconds": 15},
--   {"repetition": 2, "correct": true, "attempts": 2, "duration_seconds": 20},
--   {"repetition": 3, "correct": false, "attempts": 3, "duration_seconds": 30},
--   {"repetition": 4, "correct": true, "attempts": 1, "duration_seconds": 12},
--   {"repetition": 5, "correct": true, "attempts": 1, "duration_seconds": 10}
-- ]
