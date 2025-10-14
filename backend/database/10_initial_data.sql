-- =====================================================
-- SCRIPT 10: DATOS INICIALES
-- =====================================================
-- Inserta datos básicos necesarios para inicializar la aplicación:
-- - Los 4 juegos principales
-- - Funciones útiles para consultas
-- - Usuario administrador de prueba
-- - Estudiante de prueba

-- =====================================================
-- 1. CATÁLOGO DE JUEGOS (OBLIGATORIO)
-- =====================================================

INSERT INTO games (game_type, name, description) VALUES
(
    'touch_number',
    'Toca el número que suena',
    'Escucha un número y selecciona el correcto entre las opciones mostradas en pantalla.'
),
(
    'order_sequence',
    'Ordena la secuencia',
    'Ordena los números desordenados colocándolos en la fila inferior en orden correcto.'
),
(
    'distribute_equal',
    'Reparte el mismo número en cada recipiente',
    'Distribuye las bolas u objetos en los recipientes para que todos tengan la misma cantidad.'
),
(
    'remove_equal',
    'Deja el mismo número en cada recipiente',
    'Retira objetos de los recipientes para que todos queden con la misma cantidad.'
);

-- =====================================================
-- 2. FUNCIONES ÚTILES PARA CONSULTAS (RECOMENDADO)
-- =====================================================

-- Función para obtener estadísticas de un estudiante
CREATE OR REPLACE FUNCTION get_student_statistics(p_student_id UUID)
RETURNS TABLE (
    game_name VARCHAR,
    total_sessions BIGINT,
    completed_sessions BIGINT,
    avg_score NUMERIC,
    total_correct BIGINT,
    total_incorrect BIGINT,
    last_played TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.name,
        COUNT(gs.id),
        COUNT(gs.id) FILTER (WHERE gs.status = 'completed'),
        AVG(gs.score) FILTER (WHERE gs.status = 'completed'),
        SUM(gs.total_correct),
        SUM(gs.total_incorrect),
        MAX(gs.started_at)
    FROM games g
    LEFT JOIN game_sessions gs ON gs.game_id = g.id AND gs.student_id = p_student_id
    GROUP BY g.id, g.name
    ORDER BY g.name;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener el progreso reciente de un estudiante
CREATE OR REPLACE FUNCTION get_student_recent_progress(
    p_student_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    date DATE,
    game_name VARCHAR,
    sessions_count BIGINT,
    avg_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(gs.started_at) AS date,
        g.name,
        COUNT(gs.id),
        AVG(gs.score) FILTER (WHERE gs.status = 'completed')
    FROM game_sessions gs
    JOIN games g ON g.id = gs.game_id
    WHERE gs.student_id = p_student_id
      AND gs.started_at >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY DATE(gs.started_at), g.name
    ORDER BY date DESC, g.name;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener todos los estudiantes de un tutor
CREATE OR REPLACE FUNCTION get_tutor_students(p_tutor_id UUID)
RETURNS TABLE (
    student_id UUID,
    username VARCHAR,
    full_name VARCHAR,
    photo_url TEXT,
    is_primary_tutor BOOLEAN,
    total_sessions BIGINT,
    last_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.username,
        s.full_name,
        s.photo_url,
        str.is_primary,
        COUNT(gs.id),
        MAX(gs.started_at)
    FROM students s
    JOIN student_tutor_relations str ON str.student_id = s.id
    LEFT JOIN game_sessions gs ON gs.student_id = s.id
    WHERE str.tutor_id = p_tutor_id
    GROUP BY s.id, s.username, s.full_name, s.photo_url, str.is_primary
    ORDER BY s.full_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_statistics IS 'Obtiene estadísticas agregadas de todos los juegos para un estudiante';
COMMENT ON FUNCTION get_student_recent_progress IS 'Obtiene el progreso reciente de un estudiante por día y juego';
COMMENT ON FUNCTION get_tutor_students IS 'Obtiene la lista de estudiantes asignados a un tutor con información resumida';

-- =====================================================
-- 3. USUARIO ADMINISTRADOR DE PRUEBA
-- =====================================================
-- IMPORTANTE: Este admin usa un UUID fijo para testing.
-- En producción deberías:
--   1. Crear usuario en Supabase Auth Dashboard con email/password
--   2. Usar el UUID real generado por Supabase
--   3. Cambiar el username, email y contraseña
--
--  NOTA: Este INSERT fallará si no existe el usuario en auth.users
-- Para crear el usuario manualmente, usa Supabase Auth Dashboard:
--   Email: admin@tatomaths.com
--   Password: admin123
--   UUID: cddd251e-ecc5-4cd0-9499-b8f308648210

INSERT INTO user_profiles (
    id,
    username,
    role,
    full_name,
    email
) VALUES (
    'cddd251e-ecc5-4cd0-9499-b8f308648210'::UUID,  -- UUID fijo para testing
    'admin',  -- Username para login
    'admin',
    'Admin TatoMaths',
    'admin@tatomaths.com'
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

-- =====================================================
-- 4. ESTUDIANTE DE PRUEBA
-- =====================================================
-- Estudiante con secuencia de pictogramas para testing del login
-- Los pictogramas disponibles son:
-- perro, gato, tortuga, pingüino, caballo, león, elefante, periquito, pez payaso, mariquita

INSERT INTO students (
    username,
    full_name,
    date_of_birth,
    pictogram_login_sequence,
    notes
) VALUES (
    'pepito',
    'Pepito García',
    '2018-05-15',
    ARRAY['perro', 'gato', 'tortuga'],  -- Secuencia: perro, gato, tortuga
    'Estudiante de prueba para testing. Secuencia: perro → gato → tortuga'
) ON CONFLICT (username) DO NOTHING;

-- Nota: Las preferencias del estudiante se crean automáticamente por el trigger

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    games_count INTEGER;
    users_count INTEGER;
    students_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO games_count FROM games;
    SELECT COUNT(*) INTO users_count FROM user_profiles;
    SELECT COUNT(*) INTO students_count FROM students;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE ' INICIALIZACIÓN COMPLETADA';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE ' Datos insertados:';
    RAISE NOTICE '   - % juegos registrados', games_count;
    RAISE NOTICE '   - % usuarios admin/tutor', users_count;
    RAISE NOTICE '   - % estudiantes', students_count;
    RAISE NOTICE '';
    RAISE NOTICE ' Juegos disponibles:';
    RAISE NOTICE '   1. Toca el número que suena';
    RAISE NOTICE '   2. Ordena la secuencia';
    RAISE NOTICE '   3. Reparte el mismo número en cada recipiente';
    RAISE NOTICE '   4. Deja el mismo número en cada recipiente';
    RAISE NOTICE '';
    RAISE NOTICE ' Usuarios de prueba creados:';
    RAISE NOTICE '   Admin: username=admin, email=admin@tatomaths.com';
    RAISE NOTICE '   Estudiante: username=pepito (secuencia: perro → gato → tortuga)';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
