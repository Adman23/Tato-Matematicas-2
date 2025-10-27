-- =====================================================
-- SCRIPT 01: TIPOS ENUMERADOS (ENUMS)
-- =====================================================
-- Enums necesarios para el sistema de usuarios

-- Rol de usuario (Student, Teacher, Admin)
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

COMMENT ON TYPE user_role IS 'Roles de usuario en el sistema: estudiante, profesor o administrador';
