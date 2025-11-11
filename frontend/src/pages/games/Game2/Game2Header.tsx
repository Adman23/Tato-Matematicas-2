import React from 'react';
import { IonText } from '@ionic/react';
import './Game2Header.css';

interface Game2HeaderProps {
  title: string;
  pictogram1: string;
  pictogramArrow: string;
  pictogram2: string;
  currentRound: number;
  totalRounds: number;
}

/**
 * Componente de header reutilizable para los juegos.
 * Muestra un título centrado con tres pictogramas (img1, flecha, img2) y la información de ronda a la derecha.
 *
 * @component
 * @param {Game2HeaderProps} props - Propiedades del componente.
 * @param {string} props.title - Título del juego o instrucción (ej: "Ordenar Nº").
 * @param {string} props.pictogram1 - URL o ruta del primer pictograma.
 * @param {string} props.pictogramArrow - URL o ruta del pictograma de flecha (centro).
 * @param {string} props.pictogram2 - URL o ruta del tercer pictograma.
 * @param {number} props.currentRound - Número de ronda actual.
 * @param {number} props.totalRounds - Total de rondas del juego.
 *
 * @example
 * ```tsx
 * <Game2Header
 *   title="Ordenar Nº"
 *   pictogram1={img1}
 *   pictogramArrow={flecha}
 *   pictogram2={img2}
 *   currentRound={1}
 *   totalRounds={5}
 * />
 * ```
 */
const Game2Header: React.FC<Game2HeaderProps> = ({
  title,
  pictogram1,
  pictogramArrow,
  pictogram2,
  currentRound,
  totalRounds
}) => {
  return (
    <div className="game2-header-component">
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
