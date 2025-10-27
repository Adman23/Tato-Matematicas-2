-- =====================================================
-- SCRIPT 06: BIBLIOTECA MULTIMEDIA
-- =====================================================

-- Catálogo de recursos multimedia reutilizables
CREATE TABLE media_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_type media_type NOT NULL,
    category VARCHAR(100) NOT NULL, -- ej: 'numbers', 'objects', 'containers', 'pictograms', 'help'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL, -- URL del archivo en Supabase Storage
    thumbnail_url TEXT,

    -- Metadatos
    language VARCHAR(10) DEFAULT 'es', -- Código de idioma
    tags TEXT[], -- Tags para búsqueda
    is_arasaac BOOLEAN DEFAULT FALSE, -- Si proviene de ARASAAC
    arasaac_id INTEGER, -- ID en ARASAAC si aplica

    -- Control
    is_public BOOLEAN DEFAULT TRUE, -- Si es público o personalizado
    uploaded_by UUID REFERENCES auth.users(id), -- NULL si es del sistema
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT check_file_url_not_empty CHECK (char_length(file_url) > 0)
);

-- Audios personalizados por estudiante y número
CREATE TABLE student_custom_audios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    number_value INTEGER NOT NULL CHECK (number_value >= 0 AND number_value <= 1000),
    audio_url TEXT NOT NULL, -- URL del audio en Storage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    CONSTRAINT unique_student_number_audio UNIQUE (student_id, number_value)
);

-- Imágenes personalizadas por estudiante (objetos, recipientes, etc.)
CREATE TABLE student_custom_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    image_category VARCHAR(100) NOT NULL, -- ej: 'objects', 'containers', 'numbers'
    image_name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_media_library_type ON media_library(media_type);
CREATE INDEX idx_media_library_category ON media_library(category);
CREATE INDEX idx_media_library_is_public ON media_library(is_public);
CREATE INDEX idx_media_library_tags ON media_library USING GIN(tags);
CREATE INDEX idx_media_library_arasaac ON media_library(is_arasaac) WHERE is_arasaac = TRUE;

CREATE INDEX idx_student_custom_audios_student ON student_custom_audios(student_id);
CREATE INDEX idx_student_custom_audios_number ON student_custom_audios(number_value);

CREATE INDEX idx_student_custom_images_student ON student_custom_images(student_id);
CREATE INDEX idx_student_custom_images_category ON student_custom_images(image_category);

-- Comentarios
COMMENT ON TABLE media_library IS 'Biblioteca de recursos multimedia reutilizables';
COMMENT ON TABLE student_custom_audios IS 'Audios personalizados grabados por tutor para cada estudiante';
COMMENT ON TABLE student_custom_images IS 'Imágenes personalizadas subidas por tutor para cada estudiante';

COMMENT ON COLUMN media_library.category IS 'Categoría del recurso: numbers, objects, containers, pictograms, help';
COMMENT ON COLUMN media_library.is_arasaac IS 'Indica si el recurso proviene de ARASAAC';
COMMENT ON COLUMN media_library.is_public IS 'Si es público (del sistema) o personalizado (privado)';
COMMENT ON COLUMN student_custom_audios.number_value IS 'Valor numérico para el cual se grabó este audio';
