-- =====================================================
-- SCRIPT 09: MENSAJES DE REFUERZO POSITIVO
-- =====================================================
-- Mensajes personalizados para cada estudiante

CREATE TABLE reinforcement_messages (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL, -- 'video', 'gif', 'image', 'audio', 'text'
    media_url TEXT, -- URL del archivo (video, gif, imagen, audio)
    message_text TEXT -- Texto del mensaje (si media_type es 'text')
);

-- Índice
CREATE INDEX idx_reinforcement_messages_student ON reinforcement_messages(student_id);

-- Comentarios
COMMENT ON TABLE reinforcement_messages IS 'Mensajes de refuerzo positivo personalizados por estudiante';
COMMENT ON COLUMN reinforcement_messages.student_id IS 'ID del estudiante';
COMMENT ON COLUMN reinforcement_messages.media_type IS 'Tipo de mensaje: video, gif, image, audio, text';
COMMENT ON COLUMN reinforcement_messages.media_url IS 'URL del archivo multimedia (si aplica)';
COMMENT ON COLUMN reinforcement_messages.message_text IS 'Texto del mensaje (si media_type es text)';
