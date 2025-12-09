/**
 * GameHeader - Componente de header reutilizable para juegos
 * -----------------------------------------------------------
 * Header visual que muestra el título del juego junto con tres pictogramas
 * (imagen izquierda, flecha central, imagen derecha) y el progreso de rondas.
 * Incluye un botón de home a la izquierda para salir del juego.
 *
 * Utiliza:
 * - **Ionic React** (IonText) para el texto estilizado
 * - **Flexbox CSS** para el layout responsive
 * - **GameHeader.css** para los estilos personalizados
 *
 */

import React from 'react';
import { IonIcon, IonText } from '@ionic/react';
import './GameHeader.css';
import { Button3Dtext } from '../../global_components/PushableButtons';
import { arrowBack } from 'ionicons/icons';

/**
 * Props del componente GameHeader.
 *
 * @interface GameHeaderProps
 * @property {string} title - Título del juego o instrucción principal (ej: "Ordenar Nº")
 * @property {string} pictogram1 - URL o ruta del primer pictograma (imagen izquierda)
 * @property {string} pictogramArrow - URL o ruta del pictograma de flecha central (→)
 * @property {string} pictogram2 - URL o ruta del tercer pictograma (imagen derecha)
 * @property {number} currentRound - Número de ronda actual (1-based, ej: 1, 2, 3...)
 * @property {number} totalRounds - Total de rondas del juego (ej: 5 para "1/5")
 * @property {() => void} [onBackClick] - Callback al pulsar el botón de volver atrás
 */
interface GameHeaderProps {
  title: string;
  pictogram1: string;
  pictogramArrow: string;
  pictogram2: string;
  currentRound: number;
  totalRounds: number;
  onBackClick?: () => void;
  onBackHover?: () => void;
}

/**
 * Componente GameHeader - Header visual con título, pictogramas y progreso.
 *
 * Layout:
 * - **Izquierda**: Botón home (doble click para salir)
 * - **Centro**: Título + 3 pictogramas en fila (img1, flecha, img2)
 * - **Derecha**: Indicador de ronda (ej: "1/5")
 *
 * Características:
 * - Completamente reutilizable para diferentes juegos
 * - Props flexibles para personalizar título e imágenes
 * - Botón home con doble click (primer click selecciona, segundo ejecuta)
 * - Responsive automático con media queries
 * - Fondo azul distintivo (#4FACFE) para identificar zona de header
 * - Imágenes con transparencia y padding para mejor apariencia
 *
 * @param props - Propiedades del componente (ver GameHeaderProps)
 * @returns Header completo con botón home, título, pictogramas y contador de rondas
 */
const GameHeader: React.FC<GameHeaderProps> = ({
  title,
  pictogram1,
  pictogramArrow,
  pictogram2,
  currentRound,
  totalRounds,
  onBackClick,
  onBackHover
}) => {

  return (
    <>
      <div className="game-header-component">
        <Button3Dtext
          onClick={onBackClick}
          onMouseEnter={onBackHover}
          onFocus={onBackHover}
          aria-label="Salir del juego">
          <IonIcon icon={arrowBack} />
        </Button3Dtext>
        <div className="game-header-center">
          <IonText>
            <h2 className="game-header-title">{title}</h2>
          </IonText>

          <div className="game-header-pictograms">
            <img
              src={pictogram1}
              alt="Pictograma 1"
              className="game-header-pictogram"
            />
            <img
              src={pictogramArrow}
              alt="Flecha"
              className="game-header-pictogram game-header-arrow"
            />
            <img
              src={pictogram2}
              alt="Pictograma 2"
              className="game-header-pictogram"
            />
          </div>
        </div>

        <IonText className="game-header-round">
          <p>{currentRound}/{totalRounds}</p>
        </IonText>
      </div>
    </>
  );

};

export default GameHeader;
