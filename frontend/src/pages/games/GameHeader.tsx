/**
 * Game2Header - Componente de header reutilizable para juegos
 * -----------------------------------------------------------
 * Header visual que muestra el título del juego junto con tres pictogramas
 * (imagen izquierda, flecha central, imagen derecha) y el progreso de rondas.
 *
 * Utiliza:
 * - **Ionic React** (IonText) para el texto estilizado
 * - **Flexbox CSS** para el layout responsive
 * - **Game2Header.css** para los estilos personalizados
 *
 */

import React from 'react';
import { IonText } from '@ionic/react';
import './GameHeader.css';

/**
 * Props del componente Game2Header.
 *
 * @interface Game2HeaderProps
 * @property {string} title - Título del juego o instrucción principal (ej: "Ordenar Nº")
 * @property {string} pictogram1 - URL o ruta del primer pictograma (imagen izquierda)
 * @property {string} pictogramArrow - URL o ruta del pictograma de flecha central (→)
 * @property {string} pictogram2 - URL o ruta del tercer pictograma (imagen derecha)
 * @property {number} currentRound - Número de ronda actual (1-based, ej: 1, 2, 3...)
 * @property {number} totalRounds - Total de rondas del juego (ej: 5 para "1/5")
 * @property {() => void} [onHomeClick] - Función opcional para manejar el click en el botón de home
 */
interface Game2HeaderProps {
  title: string;
  pictogram1: string;
  pictogramArrow: string;
  pictogram2: string;
  currentRound: number;
  totalRounds: number;
  onHomeClick?: () => void;
}

/**
 * Componente Game2Header - Header visual con título, pictogramas y progreso.
 *
 * Layout:
 * - **Izquierda**: Vacío (espacio para balance visual)
 * - **Centro**: Título + 3 pictogramas en fila (img1, flecha, img2)
 * - **Derecha**: Indicador de ronda (ej: "1/5")
 *
 * Características:
 * - Completamente reutilizable para diferentes juegos
 * - Props flexibles para personalizar título e imágenes
 * - Responsive automático con media queries
 * - Fondo azul distintivo (#4FACFE) para identificar zona de header
 * - Imágenes con transparencia y padding para mejor apariencia
 *
 * Uso:
 * - Game2 (Ordenar secuencia): Muestra icono de ordenar + flecha + número del juego
 * - Puede adaptarse a otros juegos cambiando las imágenes y título
 *
 * @param props - Propiedades del componente (ver Game2HeaderProps)
 * @returns Header completo con título, pictogramas y contador de rondas
 *
 * @example
 * // Header para Juego 2 con pictogramas de ordenar
 * import imgOrdenar from './img/ordenar.png';
 * import imgFlecha from './flecha.png';
 * import imgJuego from './img/juegoX.png';
 *
 *
 * @example
 * // Header genérico para otro juego
 * <Game2Header
 *   title="Sumar Nº"
 *   pictogram1="/assets/suma.png"
 *   pictogramArrow="/assets/igual.png"
 *   pictogram2="/assets/resultado.png"
 *   currentRound={3}
 *   totalRounds={10}
 * />
 * // Resultado: "Sumar Nº [+] [=] [?]                        3/10"
 */
const Game2Header: React.FC<Game2HeaderProps> = ({
  title,
  pictogram1,
  pictogramArrow,
  pictogram2,
  currentRound,
  totalRounds,
  onHomeClick
}) => {
  return (
    <div className="game2-header-component">
      {/* Botón Home a la izquierda (opcional) */}
      <div className="game2-header-left">
        {onHomeClick && (
          <button onClick={onHomeClick} className="game2-header-home-button">
            <img src="/assets/pictograms/home.png" alt="Volver al inicio" />
          </button>
        )}
      </div>

      <div className="game2-header-center">
        <IonText>
          <h2 className="game2-header-title">{title}</h2>
        </IonText>

        <div className="game2-header-pictograms">
          <img
            src={pictogram1}
            alt="Pictograma 1"
            className="game2-header-pictogram"
          />
          <img
            src={pictogramArrow}
            alt="Flecha"
            className="game2-header-pictogram game2-header-arrow"
          />
          <img
            src={pictogram2}
            alt="Pictograma 2"
            className="game2-header-pictogram"
          />
        </div>
      </div>

      <IonText className="game2-header-round">
        <p>{currentRound}/{totalRounds}</p>
      </IonText>
    </div>
  );
};

export default Game2Header;
