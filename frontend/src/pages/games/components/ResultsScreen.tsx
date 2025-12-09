import React, { useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, time, star, closeCircle } from 'ionicons/icons';
import './ResultsScreen.css';
import GameHeader from './GameHeader';
import iconHint from '/assets/Tato/TatoPista.png';
import tatoImage from '/assets/Tato/Tato.png';
import acceptButton from '/assets/juegosImg/aceptar.png';
import audioManager from '../../../lib/AudioManager';
import type { AudioPreferences } from '../../../lib/api';
import iconCorrect from '/assets/juegosImg/correct.png';
import { Button3Dtext } from '../../global_components/PushableButtons';

interface ResultsScreenProps {
  totalRounds: number;
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
  audioPreferences?: AudioPreferences; // Preferencias de audio del usuario
  enableHoverMode?: boolean;
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
  elapsedTime = 0,
  audioPreferences,
  enableHoverMode = false
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
    if (percentage >= 90) return 5;
    if (percentage >= 75) return 4;
    if (percentage >= 50) return 3;
    if (percentage >= 25) return 2;
    return 1;
  };

  const stars = calculateStars();

  // Reproducir sonido de trofeo temático después de que la pantalla esté completamente cargada
  useEffect(() => {
    const getVolumeLevel = (volume: string) => {
      switch (volume) {
        case 'silencio': return 0;
        case 'bajito': return 0.3;
        case 'medio': return 0.6;
        case 'alto': return 1.0;
        default: return 0.6;
      }
    };

    // Esperar a que la pantalla se renderice completamente antes de reproducir el sonido
    const timer = setTimeout(() => {
      const soundPath = audioPreferences?.theme
        ? `/assets/sounds/trophy_${audioPreferences.theme}.mp3`
        : '/assets/sounds/trophy_classic.mp3';

      const volumeLevel = audioPreferences?.volume ? getVolumeLevel(audioPreferences.volume) : 0.6;

      audioManager.setVolume(volumeLevel);
      void audioManager.play(soundPath);
    }, 300); // Delay de 300ms para asegurar que la pantalla esté completamente renderizada

    return () => {
      clearTimeout(timer);
      try {
        audioManager.stop();
      } catch (e) { /* ignore */ }
    };
  }, [audioPreferences]);

  return (
    <div className="results-wrapper">
      <GameHeader
        title={headerTitle}
        pictogram1={headerPictogram1}
        pictogramArrow={headerPictogramArrow}
        pictogram2={headerPictogram2}
        currentRound={totalRounds}
        totalRounds={totalRounds}
        onBackClick={onHomeClick}
        onBackHover={enableHoverMode ? onHomeClick : undefined}
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
          {[1, 2, 3, 4, 5].map((starNum) => (
            <IonIcon
              key={starNum}
              icon={star}
              className={`star ${starNum <= stars ? 'star-active' : 'star-inactive'}`}
            />
          ))}
        </div>

        {/* Botón Aceptar */}
        <div className="accept-button-container">
          <Button3Dtext
            className="exit-btn"
            onClick={onHomeClick}
            onMouseEnter={enableHoverMode ? onHomeClick : undefined}
            aria-label="Aceptar y volver"
          >
            <img src={iconCorrect} alt="Aceptar" />
          </Button3Dtext>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
