-- =====================================================
-- SCRIPT 05: RELACIÓN N:M TEACHER-GROUP
-- =====================================================
-- Un tutor puede estar en múltiples grupos
-- Un grupo puede tener múltiples tutores

CREATE TABLE teacher_group_relations (
    id SERIAL PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,

    CONSTRAINT unique_teacher_group UNIQUE (teacher_id, group_id)
);

-- Índices
CREATE INDEX idx_teacher_group_relations_teacher ON teacher_group_relations(teacher_id);
CREATE INDEX idx_teacher_group_relations_group ON teacher_group_relations(group_id);

-- Trigger: Validar que solo teachers pueden estar en esta tabla
CREATE OR REPLACE FUNCTION validate_teacher_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE id = NEW.teacher_id AND role = 'teacher'
    ) THEN
        RAISE EXCEPTION 'Solo usuarios con rol teacher pueden estar en teacher_group_relations';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_teacher_role_before_insert
    BEFORE INSERT OR UPDATE ON teacher_group_relations
    FOR EACH ROW
    EXECUTE FUNCTION validate_teacher_role();

-- Comentarios
COMMENT ON TABLE teacher_group_relations IS 'Relación N:M entre tutores y grupos';
COMMENT ON COLUMN teacher_group_relations.teacher_id IS 'ID del tutor';
COMMENT ON COLUMN teacher_group_relations.group_id IS 'ID del grupo';
