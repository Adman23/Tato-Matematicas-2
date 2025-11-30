import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, time, star, closeCircle } from 'ionicons/icons';
import './ResultsScreen.css';
import GameHeader from './GameHeader';
import iconHint from '/assets/Tato/TatoPista.png';
import tatoImage from '/assets/Tato/Tato.png';
import acceptButton from '/assets/juegosImg/aceptar.png';

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
  elapsedTime?: number; // tiempo en segundos
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  totalRounds,
  totalHints,
  totalErrors,
  totalNumbersCorrect,
  totalNumbersRequired,
  onHomeClick,
  headerTitle,
  headerPictogram1,
  headerPictogramArrow,
  headerPictogram2,
  elapsedTime = 0
}) => {
  const netCorrect = Math.max(totalNumbersCorrect - totalHints, 0);

  // Formatear tiempo como MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular estrellas (simple: 3 si todos correctos, 2 si >50%, 1 si completó)
  const calculateStars = () => {
    const percentage = (netCorrect / totalNumbersRequired) * 100;
    if (percentage >= 90) return 3;
    if (percentage >= 50) return 2;
    return 1;
  };

  const stars = calculateStars();

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

      <div className="results-screen-new" role="region" aria-label="Resumen de la partida">
        <h1 className="results-title-new">¡Lo has conseguido!</h1>

        <div className="results-content">
          {/* Tato a la izquierda */}
          <div className="tato-container">
            <img src={tatoImage} alt="Tato celebrando" className="tato-image" />
          </div>

          {/* Estadísticas a la derecha */}
          <div className="stats-container">
            <div className="stat-row">
              <IonIcon icon={checkmarkCircle} className="stat-icon stat-icon-green" />
              <span className="stat-label">Aciertos:</span>
              <span className="stat-value">{netCorrect}</span>
            </div>

            <div className="stat-row">
              <img src={iconHint} alt="Pistas" className="stat-icon-img" />
              <span className="stat-label">Pistas:</span>
              <span className="stat-value">{totalHints}</span>
            </div>

            <div className="stat-row">
              <IonIcon icon={closeCircle} className="stat-icon stat-icon-red" />
              <span className="stat-label">Errores:</span>
              <span className="stat-value">{totalErrors}</span>
            </div>

            <div className="stat-row">
              <IonIcon icon={time} className="stat-icon stat-icon-blue" />
              <span className="stat-label">Tiempo:</span>
              <span className="stat-value">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>

        {/* Estrellas */}
        <div className="stars-container">
          {[1, 2, 3].map((starNum) => (
            <IonIcon
              key={starNum}
              icon={star}
              className={`star ${starNum <= stars ? 'star-active' : 'star-inactive'}`}
            />
          ))}
        </div>

        {/* Botón Aceptar */}
        <div className="accept-button-container">
          <button
            className="pushable-accept-button"
            onClick={onHomeClick}
            aria-label="Aceptar y volver"
          >
            <span className="shadow-accept"></span>
            <span className="edge-accept"></span>
            <span className="front-accept">
              <img
                src={acceptButton}
                alt="Aceptar"
                className="accept-icon"
              />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
