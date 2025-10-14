-- =====================================================
-- SCRIPT 05: SESIONES DE JUEGO Y RESULTADOS
-- =====================================================

-- Sesión de juego (una partida completa con N repeticiones)
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    config_snapshot JSONB, -- Snapshot de la configuración utilizada en esta sesión

    status session_status DEFAULT 'in_progress',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_duration_seconds INTEGER, -- Duración total en segundos

    total_attempts INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_incorrect INTEGER DEFAULT 0,
    total_omissions INTEGER DEFAULT 0, -- Repeticiones no completadas

    score DECIMAL(5,2) -- Puntuación calculada (0-100)
);

-- Resultados por repetición dentro de una sesión
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    repetition_number INTEGER NOT NULL CHECK (repetition_number > 0),

    -- Datos del desafío presentado
    challenge_data JSONB NOT NULL, -- Datos específicos del desafío (ej: número a encontrar, secuencia, etc.)
    correct_answer JSONB NOT NULL, -- Respuesta correcta esperada

    -- Respuesta del estudiante
    student_answer JSONB, -- Respuesta dada por el estudiante
    is_correct BOOLEAN,
    attempts_count INTEGER DEFAULT 1 CHECK (attempts_count > 0),

    -- Tiempos
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Ayudas utilizadas
    hints_used INTEGER DEFAULT 0,

    CONSTRAINT unique_session_repetition UNIQUE (session_id, repetition_number)
);

-- Índices
CREATE INDEX idx_game_sessions_student ON game_sessions(student_id);
CREATE INDEX idx_game_sessions_game ON game_sessions(game_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_student_game ON game_sessions(student_id, game_id);
CREATE INDEX idx_game_sessions_started_at ON game_sessions(started_at DESC);

CREATE INDEX idx_game_results_session ON game_results(session_id);
CREATE INDEX idx_game_results_is_correct ON game_results(is_correct);
CREATE INDEX idx_game_results_started_at ON game_results(started_at DESC);

-- Función para calcular score de una sesión
CREATE OR REPLACE FUNCTION calculate_session_score(p_session_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_total_results INTEGER;
    v_correct_results INTEGER;
    v_score DECIMAL(5,2);
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_correct = TRUE)
    INTO v_total_results, v_correct_results
    FROM game_results
    WHERE session_id = p_session_id;

    IF v_total_results = 0 THEN
        RETURN 0;
    END IF;

    v_score := (v_correct_results::DECIMAL / v_total_results::DECIMAL) * 100;

    RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estadísticas de sesión al insertar/actualizar resultado
CREATE OR REPLACE FUNCTION update_session_statistics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE game_sessions
    SET
        total_attempts = (
            SELECT SUM(attempts_count)
            FROM game_results
            WHERE session_id = NEW.session_id
        ),
        total_correct = (
            SELECT COUNT(*)
            FROM game_results
            WHERE session_id = NEW.session_id AND is_correct = TRUE
        ),
        total_incorrect = (
            SELECT COUNT(*)
            FROM game_results
            WHERE session_id = NEW.session_id AND is_correct = FALSE
        ),
        score = calculate_session_score(NEW.session_id)
    WHERE id = NEW.session_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_stats_on_result_change
    AFTER INSERT OR UPDATE ON game_results
    FOR EACH ROW
    EXECUTE FUNCTION update_session_statistics();

-- Trigger para marcar sesión como completada
CREATE OR REPLACE FUNCTION check_session_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_expected_repetitions INTEGER;
    v_completed_repetitions INTEGER;
BEGIN
    -- Obtener repeticiones esperadas del snapshot de configuración
    v_expected_repetitions := (NEW.config_snapshot->>'repetitions_per_session')::INTEGER;

    -- Contar repeticiones completadas
    SELECT COUNT(*)
    INTO v_completed_repetitions
    FROM game_results
    WHERE session_id = NEW.id AND completed_at IS NOT NULL;

    -- Si se completaron todas las repeticiones, marcar sesión como completada
    IF v_completed_repetitions >= v_expected_repetitions THEN
        NEW.status := 'completed';
        NEW.completed_at := NOW();
        NEW.total_duration_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_completion_on_session_update
    BEFORE UPDATE ON game_sessions
    FOR EACH ROW
    WHEN (OLD.status = 'in_progress')
    EXECUTE FUNCTION check_session_completion();

-- Vista para estadísticas agregadas por estudiante y juego
CREATE VIEW student_game_statistics AS
SELECT
    s.id AS student_id,
    s.username,
    s.full_name,
    g.id AS game_id,
    g.name AS game_name,
    g.game_type,
    COUNT(gs.id) AS total_sessions,
    COUNT(gs.id) FILTER (WHERE gs.status = 'completed') AS completed_sessions,
    AVG(gs.score) FILTER (WHERE gs.status = 'completed') AS avg_score,
    SUM(gs.total_correct) AS total_correct,
    SUM(gs.total_incorrect) AS total_incorrect,
    SUM(gs.total_omissions) AS total_omissions,
    SUM(gs.total_duration_seconds) AS total_time_seconds,
    MAX(gs.started_at) AS last_played_at
FROM students s
CROSS JOIN games g
LEFT JOIN game_sessions gs ON gs.student_id = s.id AND gs.game_id = g.id
GROUP BY s.id, s.username, s.full_name, g.id, g.name, g.game_type;

-- Comentarios
COMMENT ON TABLE game_sessions IS 'Sesiones de juego completadas o en progreso';
COMMENT ON TABLE game_results IS 'Resultados detallados de cada repetición dentro de una sesión';

COMMENT ON COLUMN game_sessions.config_snapshot IS 'Snapshot de la configuración del juego en el momento de la sesión';
COMMENT ON COLUMN game_sessions.total_omissions IS 'Repeticiones que no se completaron';
COMMENT ON COLUMN game_sessions.score IS 'Puntuación de 0 a 100 basada en aciertos';

COMMENT ON COLUMN game_results.challenge_data IS 'Datos del desafío presentado (formato JSON específico por juego)';
COMMENT ON COLUMN game_results.correct_answer IS 'Respuesta correcta esperada (formato JSON)';
COMMENT ON COLUMN game_results.student_answer IS 'Respuesta del estudiante (formato JSON)';
COMMENT ON COLUMN game_results.attempts_count IS 'Número de intentos realizados en esta repetición';

COMMENT ON VIEW student_game_statistics IS 'Vista agregada de estadísticas por estudiante y juego';
