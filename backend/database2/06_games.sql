-- =====================================================
-- SCRIPT 06: JUEGOS
-- =====================================================
-- Catálogo de juegos disponibles

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE, -- Identificador del juego (touch_number, order_sequence, etc.)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    help_video_url TEXT
);

-- Índice
CREATE INDEX idx_games_key ON games(key);

-- Insertar los 4 juegos
INSERT INTO games (key, name, description) VALUES
('touch_number', 'Toca el número que suena', 'Se escucha un número y se escoge el correspondiente de entre los mostrados en pantalla'),
('order_sequence', 'Ordena la secuencia', 'Se muestra una fila con números desordenados y hay que colocarlos ordenados'),
('distribute_equal', 'Reparte el mismo número en cada recipiente', 'Se muestran objetos o bolas que hay que mover a los recipientes para que todos tengan la misma cantidad'),
('remove_equal', 'Deja el mismo número en cada recipiente', 'Se muestran recipientes con objetos dentro y hay que sacar los que sobren para que todos tengan la misma cantidad');

-- Comentarios
COMMENT ON TABLE games IS 'Catálogo de los 4 juegos disponibles en la aplicación';
COMMENT ON COLUMN games.key IS 'Identificador único del juego';
COMMENT ON COLUMN games.name IS 'Nombre del juego';
COMMENT ON COLUMN games.description IS 'Descripción del juego';
COMMENT ON COLUMN games.help_video_url IS 'URL del vídeo de ayuda subtitulado';
