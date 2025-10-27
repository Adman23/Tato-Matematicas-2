-- =====================================================
-- SCRIPT 03: TABLA GROUPS
-- =====================================================
-- Grupos de estudiantes y tutores

CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    alias VARCHAR(100) NOT NULL UNIQUE
);

-- Índice
CREATE INDEX idx_groups_alias ON groups(alias);

-- Agregar FK de users.group_id a groups
ALTER TABLE users
ADD CONSTRAINT users_group_id_fkey
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

-- Comentarios
COMMENT ON TABLE groups IS 'Grupos. Un estudiante pertenece a 1 grupo. Un tutor puede estar en N grupos (relación N:M)';
COMMENT ON COLUMN groups.alias IS 'Nombre del grupo (ej: "Grupo A", "Clase 1B")';
