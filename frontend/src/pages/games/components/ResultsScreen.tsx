/**
 * ResultsScreen - Game Results Summary Component
 *
 * Universal results screen component used by all games (Game1, Game2, etc.) to display
 * game completion statistics and performance feedback. Shows Tato character celebrating,
 * detailed statistics, star rating, and navigation options.
 *
 * Functional Summary:
 * - Displays game completion statistics (correct answers, hints used, errors, time)
 * - Calculates and shows star rating (1-5 stars) based on performance percentage
 * - Plays themed trophy sound based on user audio preferences
 * - Shows celebratory Tato character image
 * - Provides navigation to return home/profile
 * - Supports hover mode for automatic navigation
 * - Includes accessibility features (ARIA labels, semantic HTML)
 *
 * Key Features:
 * - **Star Rating System**: 1-5 stars based on percentage of correct answers:
 *   - 5 stars: ≥90% correct
 *   - 4 stars: ≥75% correct
 *   - 3 stars: ≥50% correct
 *   - 2 stars: ≥25% correct
 *   - 1 star: <25% correct
 * - **Net Correct Calculation**: totalNumbersCorrect - totalHints (min 0)
 * - **Time Formatting**: Displays elapsed time in MM:SS format
 * - **Themed Audio**: Plays trophy sound based on user's audio theme preference
 * - **Volume Control**: Respects user's volume settings (silencio/bajito/medio/alto)
 * - **Hover Mode Support**: Automatic navigation on hover for accessibility
 * - **Visual Feedback**: Icons for each statistic (checkmark, hint, error, clock)
 *
 * Statistics Displayed:
 * 1. **Aciertos (Correct)**: Net correct answers (excluding hints)
 * 2. **Pistas (Hints)**: Number of hints used during gameplay
 * 3. **Errores (Errors)**: Total incorrect attempts
 * 4. **Tiempo (Time)**: Total elapsed time in MM:SS format
 *
 * Audio Integration:
 * - Plays themed trophy sound on component mount (after 300ms delay)
 * - Supports audio themes: classic, theme1, theme2, etc.
 * - Volume levels: silencio (0), bajito (0.3), medio (0.6), alto (1.0)
 * - Automatically stops audio on unmount
 *
 * CSS Classes Applied (ResultsScreen.css):
 * - `.results-wrapper`: Main container wrapper
 * - `.results-screen-new`: Content area with white background
 * - `.results-title-new`: "¡Lo has conseguido!" title
 * - `.results-content`: Flexbox container for Tato and stats
 * - `.tato-container`: Left section with Tato image
 * - `.stats-container`: Right section with statistics
 * - `.stat-row`: Individual statistic row with icon and values
 * - `.stars-container`: 5-star rating display
 * - `.star-active` / `.star-inactive`: Active and inactive star styles
 * - `.accept-button-container`: Bottom button container
 *
 * @returns {JSX.Element} Results screen with statistics and celebration
 *
 * @example
 * // Game 1 (Counting) results - perfect score
 * <ResultsScreen
 *   totalRounds={5}
 *   totalHints={0}
 *   totalErrors={0}
 *   totalNumbersCorrect={10}
 *   totalNumbersRequired={10}
 *   onHomeClick={() => router.push('/student/profile')}
 *   headerTitle="Contar"
 *   headerPictogram1="/assets/pictograms/count.png"
 *   headerPictogramArrow="/assets/pictograms/arrow.png"
 *   headerPictogram2="/assets/pictograms/count.png"
 *   elapsedTime={120}
 *   audioPreferences={{ theme: 'classic', volume: 'medio' }}
 * />
 * // Result: 5 stars, 10 correct, 0 hints, 0 errors, 2:00 time
 *
 * @example
 * // Game 2 (Order Sequence) results - good performance with hints
 * <ResultsScreen
 *   totalRounds={3}
 *   totalHints={2}
 *   totalErrors={1}
 *   totalNumbersCorrect={8}
 *   totalNumbersRequired={10}
 *   onHomeClick={() => router.push('/student/profile')}
 *   headerTitle="Ordenar"
 *   headerPictogram1="/assets/pictograms/order.png"
 *   headerPictogramArrow="/assets/pictograms/arrow.png"
 *   headerPictogram2="/assets/pictograms/order.png"
 *   elapsedTime={180}
 *   audioPreferences={{ theme: 'theme1', volume: 'alto' }}
 *   enableHoverMode={true}
 * />
 * // Result: 3 stars, 6 net correct (8-2 hints), 2 hints, 1 error, 3:00 time
 *
 * @example
 * // Results with low performance
 * <ResultsScreen
 *   totalRounds={4}
 *   totalHints={3}
 *   totalErrors={5}
 *   totalNumbersCorrect={4}
 *   totalNumbersRequired={12}
 *   onHomeClick={() => router.push('/student/profile')}
 *   headerTitle="Juego"
 *   headerPictogram1="/assets/pictograms/game.png"
 *   headerPictogramArrow="/assets/pictograms/arrow.png"
 *   headerPictogram2="/assets/pictograms/game.png"
 *   elapsedTime={240}
 * />
 * // Result: 1 star, 1 net correct (4-3 hints), 3 hints, 5 errors, 4:00 time
 */

import React, { useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, time, star, closeCircle } from 'ionicons/icons';
import './ResultsScreen.css';
import GameHeader from './GameHeader';
import iconHint from '/assets/Tato/TatoPista.png';
import tatoImage from '/assets/Tato/Tato.png';
// import acceptButton from '/assets/juegosImg/aceptar.png'; Quitado porque no se usaba y daba warning para vercel
import audioManager from '../../../lib/AudioManager';
import type { AudioPreferences } from '../../../lib/api';
import iconCorrect from '/assets/juegosImg/correct.png';
import { Button3Dtext } from '../../global_components/PushableButtons';

/**
 * Props del componente ResultsScreen.
 *
 * @interface ResultsScreenProps
 * @property {number} totalRounds - Número total de rondas jugadas en la partida
 * @property {number} totalHints - Número total de pistas utilizadas durante el juego
 * @property {number} totalErrors - Número total de errores cometidos
 * @property {number} totalNumbersCorrect - Número total de respuestas correctas (incluyendo con pistas)
 * @property {number} totalNumbersRequired - Número total de respuestas requeridas para completar el juego
 * @property {() => void} onHomeClick - Callback para navegar al inicio/perfil del usuario
 * @property {string} headerTitle - Título del juego para mostrar en el header (ej: "Contar", "Ordenar")
 * @property {string} headerPictogram1 - URL del pictograma izquierdo del header
 * @property {string} headerPictogramArrow - URL del pictograma de flecha del header
 * @property {string} headerPictogram2 - URL del pictograma derecho del header
 * @property {number} [elapsedTime] - Tiempo transcurrido en segundos (default: 0)
 * @property {AudioPreferences} [audioPreferences] - Preferencias de audio del usuario (tema, volumen)
 * @property {boolean} [enableHoverMode] - Si activar navegación automática al hacer hover (default: false)
 */
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
  elapsedTime?: number;
  audioPreferences?: AudioPreferences;
  enableHoverMode?: boolean;
}

/**
 * Componente ResultsScreen - Pantalla universal de resultados para todos los juegos.
 *
 * Comportamiento:
 * - **Cálculo de aciertos netos**: Resta pistas de respuestas correctas (mínimo 0)
 * - **Sistema de estrellas**: Calcula 1-5 estrellas basado en porcentaje de aciertos
 * - **Formato de tiempo**: Convierte segundos a formato MM:SS legible
 * - **Reproducción de audio**: Reproduce sonido de trofeo temático al montar
 * - **Navegación**: Botón de aceptar para volver al perfil/inicio
 * - **Modo hover**: Soporta navegación automática al hacer hover (accesibilidad)
 *
 * Flujo de ejecución:
 * 1. Calcula aciertos netos (totalNumbersCorrect - totalHints, mínimo 0)
 * 2. Calcula porcentaje de aciertos sobre total requerido
 * 3. Determina número de estrellas (1-5) según porcentaje
 * 4. Formatea tiempo transcurrido a MM:SS
 * 5. useEffect: Reproduce sonido de trofeo temático con volumen configurado
 * 6. Renderiza header con información del juego
 * 7. Muestra título de celebración "¡Lo has conseguido!"
 * 8. Muestra Tato celebrando a la izquierda
 * 9. Muestra estadísticas a la derecha (aciertos, pistas, errores, tiempo)
 * 10. Renderiza estrellas (activas e inactivas)
 * 11. Muestra botón de aceptar con soporte hover
 *
 * Lógica de estrellas:
 * - 5 estrellas: ≥90% de aciertos netos
 * - 4 estrellas: ≥75% de aciertos netos
 * - 3 estrellas: ≥50% de aciertos netos
 * - 2 estrellas: ≥25% de aciertos netos
 * - 1 estrella: <25% de aciertos netos
 *
 * Integración de audio:
 * - Espera 300ms después del montaje para reproducir sonido
 * - Construye ruta del sonido: `/assets/sounds/trophy_{theme}.mp3`
 * - Convierte volumen de string a número (silencio=0, bajito=0.3, medio=0.6, alto=1.0)
 * - Detiene audio automáticamente al desmontar componente
 *
 * @param {ResultsScreenProps} props - Propiedades del componente (ver ResultsScreenProps)
 * @returns {JSX.Element} Pantalla de resultados con estadísticas y celebración
 *
 * @example
 * // Resultados perfectos en Game 1
 * <ResultsScreen
 *   totalRounds={5}
 *   totalHints={0}
 *   totalErrors={0}
 *   totalNumbersCorrect={10}
 *   totalNumbersRequired={10}
 *   onHomeClick={() => router.push('/student/profile')}
 *   headerTitle="Contar"
 *   headerPictogram1="/assets/pictograms/count.png"
 *   headerPictogramArrow="/assets/pictograms/arrow.png"
 *   headerPictogram2="/assets/pictograms/count.png"
 *   elapsedTime={120}
 *   audioPreferences={{ theme: 'classic', volume: 'medio' }}
 * />
 * // Muestra: 5 estrellas, 10 aciertos, 0 pistas, 0 errores, 2:00
 *
 * @example
 * // Resultados con pistas en Game 2
 * <ResultsScreen
 *   totalRounds={3}
 *   totalHints={2}
 *   totalErrors={1}
 *   totalNumbersCorrect={8}
 *   totalNumbersRequired={10}
 *   onHomeClick={() => router.push('/student/profile')}
 *   headerTitle="Ordenar"
 *   headerPictogram1="/assets/pictograms/order.png"
 *   headerPictogramArrow="/assets/pictograms/arrow.png"
 *   headerPictogram2="/assets/pictograms/order.png"
 *   elapsedTime={180}
 *   audioPreferences={{ theme: 'theme1', volume: 'alto' }}
 *   enableHoverMode={true}
 * />
 * // Muestra: 3 estrellas, 6 aciertos netos (8-2), 2 pistas, 1 error, 3:00
 */
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
  // Calcular aciertos netos restando las pistas (mínimo 0)
  // Si el alumno usa 2 pistas de 10 correctas, aciertos netos = 8
  const netCorrect = Math.max(totalNumbersCorrect - totalHints, 0);

  /**
   * Formatea tiempo en segundos a formato MM:SS legible.
   *
   * @param {number} seconds - Tiempo transcurrido en segundos
   * @returns {string} Tiempo formateado como "M:SS" o "MM:SS"
   *
   * @example
   * formatTime(65)  // "1:05"
   * formatTime(125) // "2:05"
   * formatTime(3600) // "60:00"
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Calcula el número de estrellas (1-5) basado en el porcentaje de aciertos netos.
   *
   * Lógica de cálculo:
   * - Calcula porcentaje: (netCorrect / totalNumbersRequired) * 100
   * - Asigna estrellas según umbrales:
   *   - ≥90%: 5 estrellas (excelente)
   *   - ≥75%: 4 estrellas (muy bien)
   *   - ≥50%: 3 estrellas (bien)
   *   - ≥25%: 2 estrellas (puede mejorar)
   *   - <25%: 1 estrella (necesita práctica)
   *
   * @returns {number} Número de estrellas (1-5)
   *
   * @example
   * // netCorrect = 9, totalNumbersRequired = 10
   * calculateStars() // 5 (90%)
   *
   * @example
   * // netCorrect = 6, totalNumbersRequired = 10
   * calculateStars() // 3 (60%)
   *
   * @example
   * // netCorrect = 2, totalNumbersRequired = 10
   * calculateStars() // 1 (20%)
   */
  const calculateStars = () => {
    const percentage = (netCorrect / totalNumbersRequired) * 100;
    if (percentage >= 90) return 5;
    if (percentage >= 75) return 4;
    if (percentage >= 50) return 3;
    if (percentage >= 25) return 2;
    return 1;
  };

  const stars = calculateStars();

  /**
   * Effect hook para reproducir sonido de trofeo temático al montar el componente.
   *
   * Flujo de ejecución:
   * 1. Define función helper `getVolumeLevel` para convertir string de volumen a número
   * 2. Establece timeout de 300ms para esperar renderizado completo
   * 3. Construye ruta del sonido según tema de audio del usuario (o classic por defecto)
   * 4. Obtiene nivel de volumen configurado por el usuario (o 0.6 por defecto)
   * 5. Configura volumen en audioManager
   * 6. Reproduce sonido de trofeo
   * 7. Cleanup: Limpia timeout y detiene audio al desmontar
   *
   * Temas de sonido disponibles:
   * - classic: `/assets/sounds/trophy_classic.mp3`
   * - theme1, theme2, etc.: `/assets/sounds/trophy_{theme}.mp3`
   *
   * Niveles de volumen:
   * - 'silencio': 0 (mudo)
   * - 'bajito': 0.3 (bajo)
   * - 'medio': 0.6 (medio, por defecto)
   * - 'alto': 1.0 (máximo)
   *
   * @dependencies audioPreferences - Se re-ejecuta si cambian las preferencias de audio
   */
  useEffect(() => {
    /**
     * Convierte el string de volumen del usuario a un nivel numérico (0-1).
     *
     * @param {string} volume - Nivel de volumen como string ('silencio', 'bajito', 'medio', 'alto')
     * @returns {number} Nivel de volumen numérico entre 0 y 1
     *
     * @example
     * getVolumeLevel('silencio') // 0
     * getVolumeLevel('medio')    // 0.6
     * getVolumeLevel('alto')     // 1.0
     */
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
    // Delay de 300ms asegura que todos los elementos visuales estén cargados
    const timer = setTimeout(() => {
      // Construir ruta del archivo de sonido según el tema configurado
      const soundPath = audioPreferences?.theme
        ? `/assets/sounds/trophy_${audioPreferences.theme}.mp3`
        : '/assets/sounds/trophy_classic.mp3';

      // Obtener nivel de volumen numérico desde preferencias del usuario
      const volumeLevel = audioPreferences?.volume ? getVolumeLevel(audioPreferences.volume) : 0.6;

      // Configurar volumen y reproducir sonido de trofeo
      audioManager.setVolume(volumeLevel);
      void audioManager.play(soundPath);
    }, 300);

    // Cleanup: Limpiar timeout y detener audio al desmontar componente
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
