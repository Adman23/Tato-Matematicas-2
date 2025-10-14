-- =====================================================
-- SCRIPT 01: TIPOS ENUMERADOS (ENUMS)
-- =====================================================
-- Este script crea todos los tipos enumerados utilizados en la base de datos

-- Rol de usuario (administrador o tutor)
CREATE TYPE user_role AS ENUM ('admin', 'tutor');

-- Tipo de juego
CREATE TYPE game_type AS ENUM (
    'touch_number',        -- Toca el número que suena
    'order_sequence',      -- Ordena la secuencia
    'distribute_equal',    -- Reparte el mismo número en cada recipiente
    'remove_equal'         -- Deja el mismo número en cada recipiente
);

-- Modo de visualización de números
CREATE TYPE number_display_mode AS ENUM (
    'numeric',      -- Grafía del número (1, 2, 3...)
    'pictogram',    -- Pictograma (ARASAAC)
    'audio',        -- Solo audio
    'drawing',      -- Dibujo/imagen
    'video',        -- Video
    'mixed'         -- Combinación de varios
);

-- Rango numérico para dificultad
CREATE TYPE number_range AS ENUM (
    'range_0_10',
    'range_0_20',
    'range_0_100',
    'range_0_1000'
);

-- Tipo de operación matemática
CREATE TYPE operation_type AS ENUM (
    'none',         -- Sin operaciones
    'addition',     -- Suma
    'subtraction'   -- Resta
);

-- Tipo de orden (para juego de ordenar)
CREATE TYPE order_type AS ENUM (
    'ascending',    -- Orden creciente
    'descending'    -- Orden decreciente
);

-- Tipo de medio multimedia
CREATE TYPE media_type AS ENUM (
    'audio',
    'image',
    'video',
    'gif'
);

-- Tipo de elemento visual (para juegos de recipientes)
CREATE TYPE visual_element_type AS ENUM (
    'balls_with_numbers',    -- Bolas con números
    'object_images',         -- Imágenes de objetos
    'pictograms'            -- Pictogramas
);

-- Tamaño de fuente
CREATE TYPE font_size AS ENUM (
    'small',
    'medium',
    'large',
    'extra_large'
);

-- Estado de sesión de juego
CREATE TYPE session_status AS ENUM (
    'in_progress',
    'completed',
    'abandoned'
);

COMMENT ON TYPE user_role IS 'Roles de usuario en el sistema';
COMMENT ON TYPE game_type IS 'Tipos de juegos disponibles en la aplicación';
COMMENT ON TYPE number_display_mode IS 'Modos de visualización de números para accesibilidad';
COMMENT ON TYPE number_range IS 'Rangos numéricos para niveles de dificultad';
COMMENT ON TYPE operation_type IS 'Tipos de operaciones matemáticas en los juegos';
COMMENT ON TYPE order_type IS 'Tipo de orden para el juego de ordenar secuencias';
COMMENT ON TYPE media_type IS 'Tipos de archivos multimedia';
COMMENT ON TYPE visual_element_type IS 'Tipos de elementos visuales para juegos de recipientes';
COMMENT ON TYPE font_size IS 'Tamaños de fuente para accesibilidad';
COMMENT ON TYPE session_status IS 'Estado de una sesión de juego';
