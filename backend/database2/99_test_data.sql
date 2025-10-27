-- =====================================================
-- SCRIPT 99: DATOS DE PRUEBA
-- =====================================================
-- Datos de ejemplo para probar la aplicación

-- IMPORTANTE: Ejecutar después de todos los demás scripts

-- =====================================================
-- 1. CREAR GRUPOS
-- =====================================================

INSERT INTO groups (alias) VALUES
('Grupo A'),
('Grupo B'),
('Clase 1A'),
('Clase 1B');

-- =====================================================
-- 2. CREAR USUARIOS
-- =====================================================

-- ⚠️ IMPORTANTE: Admin y Teachers deben registrarse PRIMERO en Supabase Auth
--
-- Pasos para crear Admin/Teacher:
-- 1. Registrar en Supabase Auth (devuelve un UUID que se usa en auth_user_id)
-- 2. Insertar en la tabla users con auth_user_id apuntando a ese UUID
--
-- Para este ejemplo, asumimos que YA creaste estos usuarios en Supabase Auth:
--
-- Admin:   admin@example.com / admin123
--          UUID en auth.users: 5cfe8d1a-24c3-4f6c-855c-bf5906904ada
--
-- Teacher: maria@example.com / maria123
--          UUID en auth.users: 9b1c4273-a556-4901-9185-3b14884480e8
--
-- Teacher: pedro@example.com / pedro123
--          UUID en auth.users: ad225f7d-5972-4cae-95c7-38c3f586a1fa
--
-- Si NO los has creado en Supabase Auth, comenta las líneas de INSERT de Admin/Teachers

-- ADMIN (debe existir en auth.users)
-- Descomentar después de crear en Supabase Auth

INSERT INTO users (auth_user_id, role, username, password_hash, photo_url, group_id) VALUES
('5cfe8d1a-24c3-4f6c-855c-bf5906904ada', 'admin', 'admin', '', NULL, NULL);


-- TEACHERS (deben existir en auth.users)
-- Descomentar después de crear en Supabase Auth

INSERT INTO users (auth_user_id, role, username, password_hash, photo_url, group_id) VALUES
('9b1c4273-a556-4901-9185-3b14884480e8', 'teacher', 'maria_lopez', '', 'https://via.placeholder.com/150?text=Maria', NULL),
('ad225f7d-5972-4cae-95c7-38c3f586a1fa', 'teacher', 'pedro_gomez', '', 'https://via.placeholder.com/150?text=Pedro', NULL);


-- STUDENTS (NO usan auth.users, generan su propio UUID automáticamente)
INSERT INTO users (role, username, password_hash, photo_url, group_id) VALUES
-- Grupo A
('student', 'juan_perez', crypt('perro-gato-leon', gen_salt('bf')), 'https://via.placeholder.com/150?text=Juan', 1),
('student', 'ana_garcia', crypt('gato-perro-elefante', gen_salt('bf')), 'https://via.placeholder.com/150?text=Ana', 1),
('student', 'luis_martinez', crypt('leon-tortuga-pez', gen_salt('bf')), 'https://via.placeholder.com/150?text=Luis', 1),

-- Grupo B
('student', 'sofia_rodriguez', crypt('elefante-caballo-perro', gen_salt('bf')), 'https://via.placeholder.com/150?text=Sofia', 2),
('student', 'carlos_fernandez', crypt('pingüino-mariquita-gato', gen_salt('bf')), 'https://via.placeholder.com/150?text=Carlos', 2);

-- =====================================================
-- 3. ACTUALIZAR USER PROFILES (nombres completos)
-- =====================================================

-- Trigger ya creó los perfiles vacíos para Students y Teachers
-- Ahora actualizamos full_name y notas

-- Students
UPDATE user_profiles SET
    full_name = 'Juan Pérez López',
    notes = 'Estudiante muy aplicado. Le gusta usar imágenes de animales.'
WHERE user_id = (SELECT id FROM users WHERE username = 'juan_perez');

UPDATE user_profiles SET
    full_name = 'Ana García Martínez',
    notes = 'Prefiere números grandes. Usa audio sintetizado.',
    audio_preferences = '{
        "volume": 90,
        "use_tts": true,
        "tts_voice": "es-ES-Standard-A"
    }'::jsonb
WHERE user_id = (SELECT id FROM users WHERE username = 'ana_garcia');

UPDATE user_profiles SET
    full_name = 'Luis Martínez Sánchez',
    notes = 'Requiere alto contraste y tamaño de fuente grande.',
    visual_preferences = '{
        "high_contrast": true,
        "font_size": "extra_large",
        "primary_color": "#FFFF00",
        "background_color": "#000000"
    }'::jsonb
WHERE user_id = (SELECT id FROM users WHERE username = 'luis_martinez');

UPDATE user_profiles SET
    full_name = 'Sofía Rodríguez Gómez',
    notes = 'Le gustan los pictogramas ARASAAC.',
    game_preferences = '{
        "number_display_mode": "pictogram",
        "show_number_pictogram": true,
        "visual_element_type": "pictograms"
    }'::jsonb
WHERE user_id = (SELECT id FROM users WHERE username = 'sofia_rodriguez');

UPDATE user_profiles SET
    full_name = 'Carlos Fernández Ruiz',
    notes = 'Usa switch control. Velocidad lenta.',
    accessibility_settings = '{
        "enable_switch_control": true,
        "switch_scan_speed": 1,
        "timeout_seconds": 600
    }'::jsonb
WHERE user_id = (SELECT id FROM users WHERE username = 'carlos_fernandez');

-- Teachers (opcional, para que puedan probar juegos)
-- Descomentar si creaste los teachers

UPDATE user_profiles SET
    notes = 'Perfil de prueba para María - puede probar configuraciones de juegos'
WHERE user_id = (SELECT id FROM users WHERE username = 'maria_lopez');

UPDATE user_profiles SET
    notes = 'Perfil de prueba para Pedro - puede probar configuraciones de juegos'
WHERE user_id = (SELECT id FROM users WHERE username = 'pedro_gomez');


-- =====================================================
-- 4. ASIGNAR TUTORES A GRUPOS
-- =====================================================

-- Descomentar si creaste los teachers

-- María López en Grupo A y Clase 1A
INSERT INTO teacher_group_relations (teacher_id, group_id) VALUES
((SELECT id FROM users WHERE username = 'maria_lopez'), 1), -- Grupo A
((SELECT id FROM users WHERE username = 'maria_lopez'), 3); -- Clase 1A

-- Pedro Gómez en Grupo B y Clase 1B
INSERT INTO teacher_group_relations (teacher_id, group_id) VALUES
((SELECT id FROM users WHERE username = 'pedro_gomez'), 2), -- Grupo B
((SELECT id FROM users WHERE username = 'pedro_gomez'), 4); -- Clase 1B


-- =====================================================
-- 5. CONFIGURAR JUEGOS PARA ALGUNOS ESTUDIANTES
-- =====================================================

-- Juan Pérez - Nivel fácil en todos los juegos
UPDATE game_configurations SET
    number_range = '0-10',
    settings = '{"options_count": 3}'::jsonb
WHERE student_id = (SELECT id FROM users WHERE username = 'juan_perez')
  AND game_id = (SELECT id FROM games WHERE key = 'touch_number');

UPDATE game_configurations SET
    number_range = '0-10',
    settings = '{"sequence_count": 3, "order_type": "ascending"}'::jsonb
WHERE student_id = (SELECT id FROM users WHERE username = 'juan_perez')
  AND game_id = (SELECT id FROM games WHERE key = 'order_sequence');

-- Ana García - Nivel medio
UPDATE game_configurations SET
    number_range = '0-20',
    settings = '{"options_count": 6}'::jsonb
WHERE student_id = (SELECT id FROM users WHERE username = 'ana_garcia')
  AND game_id = (SELECT id FROM games WHERE key = 'touch_number');

-- Carlos Fernández - Nivel difícil con operaciones
UPDATE game_configurations SET
    number_range = '0-20',
    settings = '{"object_count": 12, "container_count": 4, "requires_operations": true}'::jsonb
WHERE student_id = (SELECT id FROM users WHERE username = 'carlos_fernandez')
  AND game_id = (SELECT id FROM games WHERE key = 'distribute_equal');

-- =====================================================
-- 6. INSERTAR SESIONES DE JUEGO DE EJEMPLO
-- =====================================================

-- Juan juega "Toca el número" - Buen resultado
INSERT INTO game_sessions (student_id, game_id, results, total_correct, total_incorrect, total_omissions, started_at) VALUES
((SELECT id FROM users WHERE username = 'juan_perez'),
 (SELECT id FROM games WHERE key = 'touch_number'),
 '[
    {"repetition": 1, "correct": true, "attempts": 1, "duration_seconds": 12},
    {"repetition": 2, "correct": true, "attempts": 1, "duration_seconds": 10},
    {"repetition": 3, "correct": true, "attempts": 2, "duration_seconds": 18},
    {"repetition": 4, "correct": true, "attempts": 1, "duration_seconds": 9},
    {"repetition": 5, "correct": true, "attempts": 1, "duration_seconds": 8}
 ]'::jsonb,
 5, 0, 0,
 NOW() - INTERVAL '2 days');

-- Juan juega "Toca el número" - Segunda sesión
INSERT INTO game_sessions (student_id, game_id, results, total_correct, total_incorrect, total_omissions, started_at) VALUES
((SELECT id FROM users WHERE username = 'juan_perez'),
 (SELECT id FROM games WHERE key = 'touch_number'),
 '[
    {"repetition": 1, "correct": true, "attempts": 1, "duration_seconds": 8},
    {"repetition": 2, "correct": true, "attempts": 1, "duration_seconds": 7},
    {"repetition": 3, "correct": false, "attempts": 3, "duration_seconds": 25},
    {"repetition": 4, "correct": true, "attempts": 1, "duration_seconds": 6},
    {"repetition": 5, "correct": true, "attempts": 1, "duration_seconds": 7}
 ]'::jsonb,
 4, 1, 0,
 NOW() - INTERVAL '1 day');

-- Ana juega "Ordena la secuencia"
INSERT INTO game_sessions (student_id, game_id, results, total_correct, total_incorrect, total_omissions, started_at) VALUES
((SELECT id FROM users WHERE username = 'ana_garcia'),
 (SELECT id FROM games WHERE key = 'order_sequence'),
 '[
    {"repetition": 1, "correct": true, "attempts": 1, "duration_seconds": 20},
    {"repetition": 2, "correct": true, "attempts": 2, "duration_seconds": 35},
    {"repetition": 3, "correct": false, "attempts": 3, "duration_seconds": 45},
    {"repetition": 4, "correct": true, "attempts": 1, "duration_seconds": 18},
    {"repetition": 5, "correct": true, "attempts": 1, "duration_seconds": 16}
 ]'::jsonb,
 4, 1, 0,
 NOW() - INTERVAL '3 hours');

-- Carlos juega "Reparte igual" - Con operaciones
INSERT INTO game_sessions (student_id, game_id, results, total_correct, total_incorrect, total_omissions, started_at) VALUES
((SELECT id FROM users WHERE username = 'carlos_fernandez'),
 (SELECT id FROM games WHERE key = 'distribute_equal'),
 '[
    {"repetition": 1, "correct": true, "attempts": 2, "duration_seconds": 45},
    {"repetition": 2, "correct": false, "attempts": 3, "duration_seconds": 60},
    {"repetition": 3, "correct": true, "attempts": 2, "duration_seconds": 50},
    {"repetition": 4, "correct": false, "attempts": 3, "duration_seconds": 65},
    {"repetition": 5, "correct": true, "attempts": 1, "duration_seconds": 40}
 ]'::jsonb,
 3, 2, 0,
 NOW() - INTERVAL '1 hour');

-- =====================================================
-- 7. MENSAJES DE REFUERZO PERSONALIZADOS
-- =====================================================

-- Juan - Video personalizado
INSERT INTO reinforcement_messages (student_id, media_type, media_url, message_text) VALUES
((SELECT id FROM users WHERE username = 'juan_perez'), 'video', 'https://example.com/videos/felicitaciones-juan.mp4', NULL);

-- Ana - GIF animado
INSERT INTO reinforcement_messages (student_id, media_type, media_url, message_text) VALUES
((SELECT id FROM users WHERE username = 'ana_garcia'), 'gif', 'https://example.com/gifs/muy-bien.gif', NULL);

-- Luis - Audio personalizado
INSERT INTO reinforcement_messages (student_id, media_type, media_url, message_text) VALUES
((SELECT id FROM users WHERE username = 'luis_martinez'), 'audio', 'https://example.com/audio/excelente-luis.mp3', NULL);

-- Sofía - Texto
INSERT INTO reinforcement_messages (student_id, media_type, media_url, message_text) VALUES
((SELECT id FROM users WHERE username = 'sofia_rodriguez'), 'text', NULL, '¡Muy bien Sofía! Sigue así 🎉');

-- Carlos - Imagen
INSERT INTO reinforcement_messages (student_id, media_type, media_url, message_text) VALUES
((SELECT id FROM users WHERE username = 'carlos_fernandez'), 'image', 'https://example.com/images/estrella-dorada.png', NULL);

-- =====================================================
-- RESUMEN DE DATOS CREADOS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Datos de prueba insertados correctamente:';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Datos creados:';
    RAISE NOTICE '   - 4 Grupos';
    RAISE NOTICE '   - 5 Students (con perfiles configurados)';
    RAISE NOTICE '   - Configuraciones de juegos personalizadas';
    RAISE NOTICE '   - 4 Sesiones de juego con resultados';
    RAISE NOTICE '   - 5 Mensajes de refuerzo personalizados';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE - Admin y Teachers:';
    RAISE NOTICE '   1. Regístralos PRIMERO en Supabase Auth';
    RAISE NOTICE '   2. Copia los UUIDs generados';
    RAISE NOTICE '   3. Descomenta las líneas correspondientes en este script';
    RAISE NOTICE '   4. Reemplaza los UUIDs';
    RAISE NOTICE '   5. Ejecuta de nuevo';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Credenciales de Students:';
    RAISE NOTICE '   juan_perez / perro-gato-leon';
    RAISE NOTICE '   ana_garcia / gato-perro-elefante';
    RAISE NOTICE '   luis_martinez / leon-tortuga-pez';
    RAISE NOTICE '   sofia_rodriguez / elefante-caballo-perro';
    RAISE NOTICE '   carlos_fernandez / pingüino-mariquita-gato';
END $$;
