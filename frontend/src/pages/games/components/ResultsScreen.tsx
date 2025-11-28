import React from 'react';
import { IonButton, IonText } from '@ionic/react';
import './ResultsScreen.css';
import GameHeader from './GameHeader';
import iconCorrect from '/assets/juegosImg/correct.png';
import iconIncorrect from '/assets/juegosImg/incorrecto.png';
import iconHint from '/assets/Tato/TatoPista.jpeg';

interface ResultsScreenProps {
  totalRounds: number;
  completedRounds: number;
  totalHints: number;
  totalErrors: number;
  totalNumbersCorrect: number;
  totalNumbersRequired: number;
  onHomeClick: () => void;
  headerTitle: string;
  headerPictogram1: string;
  headerPictogramArrow: string;
  headerPictogram2: string;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  totalRounds,
  completedRounds,
  totalHints,
  totalErrors,
  totalNumbersCorrect,
  totalNumbersRequired,
  onHomeClick,
  headerTitle,
  headerPictogram1,
  headerPictogramArrow,
  headerPictogram2
}) => {
  const netCorrect = Math.max(totalNumbersCorrect - totalHints, 0);

  return (
    <div className="results-wrapper">
      <GameHeader
        title={headerTitle}
        pictogram1={headerPictogram1}
        pictogramArrow={headerPictogramArrow}
        pictogram2={headerPictogram2}
        currentRound={totalRounds}
        totalRounds={totalRounds}
        onHomeClick={onHomeClick}
      />

      <div className="results-screen" role="region" aria-label="Resumen de la partida">
        <IonText color="success">
          <h1 className="results-title">¡Juego completado!</h1>
        </IonText>

        <div className="results-grid" role="list">
          <div className="results-card" role="listitem">
            <img src={iconCorrect} alt="Rondas jugadas" className="results-icon" />
            <p className="results-label">Rondas</p>
            <p className="results-value">{completedRounds}/{totalRounds}</p>
          </div>
          <div className="results-card" role="listitem">
            <img src={iconHint} alt="Pistas" className="results-icon" />
            <p className="results-label">Pistas usadas</p>
            <p className="results-value">{totalHints}</p>
          </div>
          <div className="results-card" role="listitem">
            <img src={iconIncorrect} alt="Errores" className="results-icon" />
            <p className="results-label">Errores</p>
            <p className="results-value">{totalErrors}</p>
          </div>
          <div className="results-card" role="listitem">
            <img src={iconCorrect} alt="Aciertos totales" className="results-icon" />
            <p className="results-label">Aciertos totales</p>
            <p className="results-value">
              {netCorrect}/{totalNumbersRequired}
            </p>
          </div>
        </div>

        <div className="results-actions">
          <IonButton
            expand="block"
            color="primary"
            className="results-button"
            onClick={onHomeClick}
            aria-label="Volver al inicio"
          >
            Volver al inicio
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
