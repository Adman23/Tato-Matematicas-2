-- =====================================================
-- SCRIPT 00: BORRAR TODO
-- =====================================================
-- ADVERTENCIA: Este script elimina TODAS las tablas y datos
-- Usar solo para resetear la base de datos completamente

-- Eliminar tablas (en orden inverso a la creación)
DROP TABLE IF EXISTS reinforcement_messages CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS game_configurations CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS teacher_group_relations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS create_default_user_profile() CASCADE;
DROP FUNCTION IF EXISTS create_default_game_configurations() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS validate_teacher_role() CASCADE;

-- Eliminar enums
DROP TYPE IF EXISTS user_role CASCADE;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos limpiada completamente';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tablas eliminadas:';
    RAISE NOTICE '   - users, groups';
    RAISE NOTICE '   - user_profiles (Students y Teachers)';
    RAISE NOTICE '   - games, game_configurations, game_sessions';
    RAISE NOTICE '   - reinforcement_messages';
    RAISE NOTICE '   - teacher_group_relations';
END $$;
