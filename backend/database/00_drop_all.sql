-- =====================================================
-- SCRIPT 00: LIMPIAR BASE DE DATOS
-- =====================================================
-- Este script elimina TODAS las tablas, funciones, vistas y tipos
-- de la base de datos TatoMaths
--
--   PELIGRO: Este script borra TODO. Úsalo con precaución.
-- =====================================================

-- Eliminar vistas
DROP VIEW IF EXISTS student_game_statistics CASCADE;

-- Eliminar tablas (en orden inverso por dependencias)
DROP TABLE IF EXISTS game_results CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS game_configurations CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS student_custom_images CASCADE;
DROP TABLE IF EXISTS student_custom_audios CASCADE;
DROP TABLE IF EXISTS media_library CASCADE;
DROP TABLE IF EXISTS reinforcement_messages CASCADE;
DROP TABLE IF EXISTS student_preferences CASCADE;
DROP TABLE IF EXISTS student_tutor_relations CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS create_default_student_preferences() CASCADE;
DROP FUNCTION IF EXISTS create_default_game_configurations() CASCADE;
DROP FUNCTION IF EXISTS calculate_session_score(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_session_statistics() CASCADE;
DROP FUNCTION IF EXISTS check_session_completion() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_tutor() CASCADE;
DROP FUNCTION IF EXISTS is_tutor_of_student(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_student_statistics(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_student_recent_progress(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_tutor_students(UUID) CASCADE;

-- Eliminar tipos enumerados
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS font_size CASCADE;
DROP TYPE IF EXISTS visual_element_type CASCADE;
DROP TYPE IF EXISTS media_type CASCADE;
DROP TYPE IF EXISTS order_type CASCADE;
DROP TYPE IF EXISTS operation_type CASCADE;
DROP TYPE IF EXISTS number_range CASCADE;
DROP TYPE IF EXISTS number_display_mode CASCADE;
DROP TYPE IF EXISTS game_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

