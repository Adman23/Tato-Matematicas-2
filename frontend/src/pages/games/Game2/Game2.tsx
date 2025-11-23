/**
 * Juego 2: Ordena la Secuencia
 *
 * El estudiante debe ordenar números de forma ascendente o descendente
 * arrastrándolos desde la zona superior a la zona de ordenamiento.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonText,
  IonSpinner
} from '@ionic/react';
import { useHistory, Redirect } from 'react-router-dom';

import { useAuth } from '../../../contexts/AuthContext';
import { gamesAPI } from '../../../lib/api';
import type { GameConfig } from '../../../lib/api';
import DropZone from './DropZone';
import GameHeader from '../GameHeader';
import './Game2.css';

// Importar imágenes para el header
import imgOrdenar from '/assets/juegosImg/game2/ordenar.png';
import imgJuego from '/assets/juegosImg/juegoX.png';
import imgTato from '/assets/Tato/Tato.png';
import imgTatoFeliz from '/assets/Tato/TatoFeliz.png';
import imgTatoTriste from '/assets/Tato/TatoTriste.png';

// Flecha desde assets
const imgFlecha = '/assets/juegosImg/flecha.png';
const imgFlecha2 = '/assets/juegosImg/nextButton.png';

// Mapeo de números a imágenes desde assets
const PICTOGRAM_IMAGES: { [key: number]: string } = {
  0: '/assets/numbers/0.png',
  1: '/assets/numbers/1.png',
  2: '/assets/numbers/2.png',
  3: '/assets/numbers/3.png',
  4: '/assets/numbers/4.png',
  5: '/assets/numbers/5.png',
  6: '/assets/numbers/6.png',
  7: '/assets/numbers/7.png',
  8: '/assets/numbers/8.png',
  9: '/assets/numbers/9.png',
  10: '/assets/numbers/10.png'
};

const TOTAL_ROUNDS = 5;

/**
 * 
 * !! EDITED
 *  -> Now there is no student only user
 *  -> If differenciation is needed, use the role
 * Componente principal del Juego 2: Ordena la Secuencia.
 *
 * Este juego educativo presenta números desordenados que el usuario (estudiante o profesor)
 * debe ordenar arrastrándolos a sus posiciones correctas (ascendente o descendente).
 * Incluye números de ayuda pre-colocados y bloqueados para facilitar la tarea.
 *
 * Características principales:
 * - Disponible para estudiantes y profesores con las mismas características
 * - 5 rondas con números aleatorios diferentes
 * - Drag & drop nativo HTML5 para mover números
 * - Números de ayuda (40% del total) pre-colocados en verde
 * - Slots vacíos persistentes que permiten devolver números
 * - Pictogramas visuales para el rango 0-10
 * - Validación con feedback inmediato (check/cruz)
 * - Tracking completo en backend (tiempo, intentos, resultados)
 *
 * Flujo del juego:
 * 1. Carga configuración personalizada del usuario
 * 2. Crea sesión de juego en BD
 * 3. Por cada ronda:
 *    - Genera números aleatorios según config
 *    - Coloca algunos como ayuda (bloqueados)
 *    - Usuario arrastra números a posiciones correctas
 *    - Valida y guarda resultado
 * 4. Tras 5 rondas, finaliza sesión y redirige al dashboard correspondiente
 *
 * @returns Componente React con UI completa del juego
 *
 * @example
 * // Usado en el routing de la app:
 * <Route path="/game/game2" component={Game2} />
 */
const Game2: React.FC = () => {
  const history = useHistory();
  const { user, loadingAuth: authLoading } = useAuth();

  // Determinar el usuario actual (puede ser estudiante o profesor)
  const currentUser = user;

  // Flag para prevenir creación duplicada de sesión (React 18 StrictMode)
  const sessionCreatedRef = useRef(false);

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Estados del juego
  const [currentRound, setCurrentRound] = useState(1);
  const [availableNumbers, setAvailableNumbers] = useState<(number | undefined)[]>([]); // Grid fijo con números o undefined
  const [orderedNumbers, setOrderedNumbers] = useState<(number | undefined)[]>([]);
  const [correctOrder, setCorrectOrder] = useState<number[]>([]);
  const [initialNumbers, setInitialNumbers] = useState<number[]>([]); // Números iniciales desordenados de la ronda

  // Estados de UI
  const [showFeedback, setShowFeedback] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
  const [draggingNumber, setDraggingNumber] = useState<number | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  // Estados de resultados
  const [gameFinished, setGameFinished] = useState(false);
  const [roundCompleted, setRoundCompleted] = useState(false); // Si la ronda se completó

  // Estados de contadores por ronda
  const [hintsCount, setHintsCount] = useState(0); // Contador de pistas usadas
  const [errorsCount, setErrorsCount] = useState(0); // Contador de errores (colocaciones incorrectas)

  // Determinar si usar pictogramas (solo para rango 0-10)
  const usePictograms = config?.number_range === '0-10';

  // Cargar configuración al montar (solo una vez)
  useEffect(() => {
    // Resetear el ref de sesión al montar el componente
    sessionCreatedRef.current = false;

    // Resetear estados al entrar al juego
    setGameFinished(false);
    setCurrentRound(1);
    setShowFeedback(false);
    setFeedbackType(null);
    setSessionId(null);

    // Resetear contadores
    setHintsCount(0);
    setErrorsCount(0);

    loadGameConfig();
    setGameStartTime(Date.now());

    // Cleanup al desmontar: resetear ref para la próxima vez
    return () => {
      sessionCreatedRef.current = false;
    };
  },
    []);

  // Crear sesión cuando la configuración esté cargada (solo una vez)
  useEffect(() => {
    if (config && !sessionId && !sessionCreatedRef.current) {
      sessionCreatedRef.current = true;
      createGameSession();
    }

  }, [config]);

  // Generar nueva ronda cuando cambia currentRound
  useEffect(() => {
    if (config && currentRound <= TOTAL_ROUNDS) {
      generateRound();
    }

  }, [config, currentRound]);


  // Efecto para redirigir cuando el juego termine
  useEffect(() => {
    if (gameFinished) {
      const timer = setTimeout(() => {
        // Redirigir al dashboard correspondiente según el tipo de usuario
        const dashboardRoute = user?.role === "student" ? '/student/dashboard' : '/tutor/dashboard';
        history.push(dashboardRoute);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [gameFinished, history, user]);

  /**
   * Carga la configuración personalizada del juego desde el backend.
   *
   * Flujo de ejecución:
   * 1. Verifica que existe un usuario autenticado (estudiante o profesor)
   * 2. Llama a la API para obtener la config del juego 'order_sequence'
   * 3. Valida que la configuración recibida sea correcta, o usa valores por defecto
   * 4. Actualiza el estado con la configuración recibida (rango, cantidad, orden)
   * 5. Desactiva el indicador de carga
   *
   * @returns Promesa que resuelve cuando se carga la configuración
   *
   * @example
   * // Al montar el componente se carga automáticamente:
   * // config = { number_range: '0-10', settings: { quantity: 5, order: 'ascending' } }
   */
  const loadGameConfig = async () => {
    try {
      if (!currentUser?.id) return;

      const data = await gamesAPI.getGameConfig(currentUser.id, 'order_sequence');

      // Validar que la configuración tenga valores válidos
      const validatedConfig: GameConfig = {
        ...data,
        number_range: data.number_range || '0-10',
        settings: {
          quantity: data.settings?.quantity || 5,
          order: data.settings?.order || 'ascending'
        }
      };

      setConfig(validatedConfig);
      setLoading(false);
    } catch (error) {
      console.error('Error loading game config:', error);

      // Si falla la carga, usar configuración por defecto
      const defaultConfig: GameConfig = {
        game_id: 0,
        game_key: 'order_sequence',
        user_id: currentUser?.id || '',
        number_range: '0-10',
        settings: {
          quantity: 5,
          order: 'ascending'
        }
      };

      setConfig(defaultConfig);
      setLoading(false);
    }
  };

  /**
   * Crea una nueva sesión de juego en el backend para tracking de progreso.
   *
   * Flujo de ejecución:
   * 1. Verifica que existe un usuario autenticado (estudiante o profesor)
   * 2. Llama a la API para crear sesión vinculada al usuario y juego
   * 3. Guarda el session_id en estado para usarlo al guardar rondas
   * 4. El session_id permite vincular todas las rondas a esta partida
   *
   * @returns Promesa que resuelve cuando se crea la sesión
   *
   * @example
   * // Al montar el componente:
   * // sessionId = 'uuid-session-789' (se guarda en estado)
   */
  const createGameSession = async () => {
    try {
      if (!currentUser?.id) return;

      const data = await gamesAPI.createGameSession(currentUser.id, 'order_sequence');
      setSessionId(data.session_id);
    } catch (error) {
      console.error('Error creating game session:', error);
    }
  };

  /**
   * Genera los números y configuración para una nueva ronda del juego.
   * Nueva lógica: Arriba todos los números mezclados, abajo una casilla vacía a la vez.
   */
  const generateRound = () => {
    if (!config) return;

    const [min, max] = config.number_range.split('-').map(Number);

    // Validar que min y max sean números válidos
    if (isNaN(min) || isNaN(max) || min >= max) {
      console.error('Invalid number range:', config.number_range);
      return;
    }

    const quantity = config.settings.quantity || 5;

    // Validar que quantity sea un número válido
    if (isNaN(quantity) || quantity <= 0) {
      console.error('Invalid quantity:', config.settings.quantity);
      return;
    }

    // Calcular números disponibles en el rango
    const availableInRange = max - min + 1;

    // Validar que no se pidan más números de los disponibles en el rango
    if (quantity > availableInRange) {
      console.error(
        `Cannot generate ${quantity} unique numbers from range ${min}-${max} (only ${availableInRange} available). ` +
        `Please reduce quantity or increase range.`
      );
      return;
    }

    // Generar quantity números únicos aleatorios
    const numbers = new Set<number>();
    while (numbers.size < quantity) {
      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      numbers.add(randomNum);
    }

    const numbersArray = Array.from(numbers);

    // Ordenar todos los números según configuración
    const sorted = [...numbersArray].sort((a, b) =>
      config.settings.order === 'ascending' ? a - b : b - a
    );

    // Crear array de orden correcto
    setCorrectOrder(sorted);

    // Mezclar números para mostrar arriba en orden aleatorio
    const shuffled = [...numbersArray].sort(() => Math.random() - 0.5);
    setAvailableNumbers(shuffled);

    // Guardar números iniciales desordenados para enviar a BD
    setInitialNumbers(shuffled);

    // Crear array inicial vacío para la zona de ordenamiento (abajo)
    const initialOrdered = new Array(quantity).fill(undefined);
    setOrderedNumbers(initialOrdered);

    setShowFeedback(false);
    setFeedbackType(null);
    setRoundStartTime(Date.now());
    setRoundCompleted(false);
    setSelectedNumber(null); // Resetear número seleccionado

    // Reiniciar contadores de ronda
    setHintsCount(0);
    setErrorsCount(0);
  };


  /**
   * Intenta colocar un número arrastrado en el slot especificado.
   * Valida inmediatamente si es correcto o no.
   * @param currentHints - Valor actual de hints para evitar problemas de estado asíncrono
   */
  const tryPlaceNumber = (draggedNumber: number, targetIndex: number, currentHints?: number) => {
    if (showFeedback) return;

    // Buscar el primer slot vacío
    const firstEmptyIndex = orderedNumbers.findIndex(n => n === undefined);

    // Solo se puede colocar en el primer slot vacío
    if (targetIndex !== firstEmptyIndex) return;

    // Verificar si el número es correcto para esta posición
    const isCorrect = draggedNumber === correctOrder[firstEmptyIndex];

    if (!isCorrect) {
      // Mostrar feedback de error pero NO colocar el número
      setFeedbackType('incorrect');
      setShowFeedback(true);
      setErrorsCount(prev => prev + 1); // Incrementar contador de errores

      // Ocultar feedback después de 1 segundo
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackType(null);
      }, 1000);
      return;
    }

    // Es correcto: colocar el número y quitarlo de availableNumbers
    const newOrdered = [...orderedNumbers];
    newOrdered[firstEmptyIndex] = draggedNumber;
    setOrderedNumbers(newOrdered);

    // Reemplazar el número con undefined en availableNumbers (mantener posición fija)
    const newAvailable = availableNumbers.map(n => n === draggedNumber ? undefined : n);
    setAvailableNumbers(newAvailable);

    // Mostrar feedback de éxito
    setFeedbackType('correct');
    setShowFeedback(true);

    // Verificar si se completó la ronda
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackType(null);

      // Verificar si todos los números fueron colocados (todos son undefined)
      if (newAvailable.every(n => n === undefined)) {
        // Todos los números colocados: guardar y mostrar botón continuar
        saveRoundResults(currentHints);
        setRoundCompleted(true);
      }
    }, 1500);
  };

  /**
   * Guarda los resultados de la ronda actual.
   * @param currentHints - Valor actual de hints (opcional, usa hintsCount del estado si no se proporciona)
   */
  const saveRoundResults = async (currentHints?: number) => {
    const timeSeconds = (Date.now() - roundStartTime) / 1000;
    const finalHintsCount = currentHints !== undefined ? currentHints : hintsCount;

    if (sessionId) {
      try {
        // Guardar resultado de ronda completada
        await gamesAPI.saveRoundResultGame2(sessionId, {
          round: currentRound,
          numbers: initialNumbers, // Números desordenados que se presentaron al inicio
          correct_order: correctOrder, // Orden correcto esperado
          is_correct: true, // Ronda completada correctamente
          time_seconds: timeSeconds,
          hints: finalHintsCount,
          total_incorrect: errorsCount,
          omissions: 0 // No hay omisiones porque completó todos
        });
      } catch (error) {
        console.error('Error saving round:', error);
      }
    }
  };

  /**
   * Avanza a la siguiente ronda o finaliza el juego.
   * Se llama cuando el usuario pulsa el botón de continuar.
   */
  const advanceToNextRound = () => {
    if (currentRound < TOTAL_ROUNDS) {
      setCurrentRound(prev => prev + 1);
    } else {
      finishGame();
    }
  };

  /**
   * Proporciona una pista colocando automáticamente el número correcto.
   */
  const useHint = () => {
    // No permitir usar pista durante feedback o si no hay números disponibles
    if (showFeedback) return;

    const hasAvailableNumbers = availableNumbers.some(n => n !== undefined);
    if (!hasAvailableNumbers) return;

    // Calcular el nuevo valor de hints
    const newHintsCount = hintsCount + 1;

    // Incrementar contador de pistas
    setHintsCount(newHintsCount);

    // Encontrar el primer slot vacío
    const firstEmptyIndex = orderedNumbers.findIndex(n => n === undefined);
    if (firstEmptyIndex === -1) return;

    // Obtener el número correcto para esa posición
    const correctNumber = correctOrder[firstEmptyIndex];

    // Colocar el número correcto automáticamente, pasando el valor actualizado de hints
    tryPlaceNumber(correctNumber, firstEmptyIndex, newHintsCount);
  };

  /**
   * Finaliza la sesión de juego y registra el tiempo total en el backend.
   *
   * Flujo de ejecución:
   * 1. Calcula el tiempo total desde que empezó el juego
   * 2. Envía el tiempo al backend para cerrar la sesión
   * 3. Marca el juego como finalizado en el estado
   * 4. El efecto useEffect redirige al dashboard tras 2 segundos
   *
   * @returns Promesa que resuelve cuando se finaliza la sesión
   *
   * @example
   * // Al completar la ronda 5:
   * // totalTimeSeconds = 150.2 (2 minutos y medio)
   * // → Guarda en BD y marca gameFinished = true
   * // → Muestra "¡Juego completado!" y redirige
   */
  const finishGame = async () => {
    const totalTimeSeconds = (Date.now() - gameStartTime) / 1000;

    if (sessionId) {
      try {
        await gamesAPI.finishGameSession(sessionId, totalTimeSeconds);
      } catch (error) {
        console.error('Error finishing game:', error);
      }
    }

    setGameFinished(true);
  };

  /**
   * Maneja la salida anticipada del juego (botón home).
   */
  const handleEarlyExit = async () => {
    if (sessionId) {
      try {
        const hasPlacedNumbers = orderedNumbers.some(num => num !== undefined);

        if (hasPlacedNumbers) {
          const timeSeconds = (Date.now() - roundStartTime) / 1000;

          // Contar cuántos números NO fueron colocados (quedaron sin colocar)
          const omissionsCount = availableNumbers.filter(n => n !== undefined).length;

          await gamesAPI.saveRoundResultGame2(sessionId, {
            round: currentRound,
            numbers: initialNumbers, // Números desordenados que se presentaron
            correct_order: correctOrder, // Orden correcto esperado
            is_correct: false, // No completó la ronda
            time_seconds: timeSeconds,
            hints: hintsCount,
            total_incorrect: errorsCount,
            omissions: omissionsCount // Números que dejó sin colocar
          });
        }

        const totalTimeSeconds = (Date.now() - gameStartTime) / 1000;
        await gamesAPI.finishGameSession(sessionId, totalTimeSeconds);
      } catch (error) {
        console.error('Error saving early exit:', error);
      }
    }

    // Redirect to dashboard
    const dashboardRoute = user?.role == 'student' ? '/student/dashboard' : '/tutor/dashboard';
    history.push(dashboardRoute);
  };

  /**
   * Maneja el drag start para HTML5 drag and drop.
   */
  const handleDragStart = (e: React.DragEvent, number: number) => {
    if (showFeedback) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', number.toString());

    // Deseleccionar cualquier número previamente seleccionado
    setSelectedNumber(null);

    // Crear imagen personalizada para drag
    const dragElement = e.currentTarget as HTMLElement;
    const clone = dragElement.cloneNode(true) as HTMLElement;

    // Aplicar estilos: siempre rosa con borde negro (estilo .number-card-selected)
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.transform = 'scale(1.3)';
    clone.style.boxShadow = 'none';
    clone.style.background = '#FFB7FA';
    clone.style.borderColor = '#000000';

    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, 55, 55);

    setTimeout(() => {
      document.body.removeChild(clone);
    }, 0);

    setDraggingNumber(number);
  };

  /**
   * Maneja el drag end para limpiar el estado.
   */
  const handleDragEnd = () => {
    setDraggingNumber(null);
  };

  /**
   * Maneja el click en un número para seleccionarlo (rojo).
   */
  const handleNumberClick = (number: number) => {
    if (showFeedback) return;
    setSelectedNumber(selectedNumber === number ? null : number);
  };

  /**
   * Maneja el drag over en un slot.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * Maneja el drop en un slot.
   */
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedNumber = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(draggedNumber)) {
      tryPlaceNumber(draggedNumber, targetIndex);
    }
    setDraggingNumber(null);
  };



  // Pantalla de carga de autenticación
  if (authLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: '50%' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Redirigir si no hay usuario autenticado (estudiante o profesor)
  if (!user) {
    return <Redirect to="/student/login" />;
  }

  // Pantalla de carga del juego
  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: '50%' }}>
            <IonSpinner name="crescent" />
            <IonText>
              <p>Cargando juego...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Si el juego terminó, mostrar mensaje
  if (gameFinished) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: '50%' }}>
            <IonText color="success">
              <h1>¡Juego completado!</h1>
              <h1>¡AQUÍ PODRIA IR EL MENSAJE DE FEEDBACK! ??</h1>
              <p>Volviendo al inicio...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="game2-content">
        {/* Header */}
        <GameHeader
          title="Ordenar Nº"
          pictogram1={imgOrdenar}
          pictogramArrow={imgFlecha}
          pictogram2={imgJuego}
          currentRound={currentRound}
          totalRounds={TOTAL_ROUNDS}
          onHomeClick={handleEarlyExit}
        />



        {/* Zona de juego */}
        <div className="game2-container">

          {/* Números disponibles (arriba) - Grid fijo con números o huecos vacíos */}
          <div className="available-numbers-top" id="available-zone">
            {availableNumbers.map((num, index) => {
              if (num === undefined) {
                // Hueco vacío - círculo gris con borde punteado negro
                return (
                  <div
                    key={`empty-${index}`}
                    className="number-card-v2 number-card-empty"
                  />
                );
              }

              const pictogramImg = usePictograms && num <= 10 ? PICTOGRAM_IMAGES[num] : null;
              const isBeingDragged = draggingNumber === num;
              const isSelected = selectedNumber === num;

              // Determinar las clases CSS
              let classes = 'number-card-v2';
              // Si está siendo arrastrado O está seleccionado: estilo rosa
              if (isBeingDragged || isSelected) {
                classes += ' number-card-selected';
              }

              return (
                <div
                  key={`available-${num}-${index}`}
                  className={classes}
                  draggable={!showFeedback}
                  onDragStart={(e) => handleDragStart(e, num)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleNumberClick(num)}
                  style={{ cursor: showFeedback ? 'not-allowed' : 'grab' }}
                >
                  {pictogramImg ? (
                    <img
                      src={pictogramImg}
                      alt={`Pictograma número ${num}`}
                      className="pictogram-image"
                    />
                  ) : (
                    <span className="number-value">{num}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Zona de ordenamiento (abajo) - Una casilla vacía a la vez */}
          <DropZone
            numbers={orderedNumbers}
            correctOrder={correctOrder}
            showFeedback={showFeedback}
            totalSlots={orderedNumbers.length}
            usePictogram={usePictograms}
            lockedIndices={new Set()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            feedbackType={feedbackType}
          />
        </div>

        {/* Botones de control */}
        <div className="check-button-container">
          {/* Botón de pistas (Tato) - Solo visible cuando la ronda NO está completada */}
          {!roundCompleted && (
            <IonButton
              fill="clear"
              className="game2-check-button game2-hint-button"
              onClick={useHint}
              disabled={availableNumbers.every(n => n === undefined)}
            >
              <img
                src={
                  feedbackType === 'correct'
                    ? imgTatoFeliz
                    : feedbackType === 'incorrect'
                      ? imgTatoTriste
                      : imgTato
                }
                alt="Pista"
                className="game2-check-button-image"
              />
            </IonButton>
          )}

          {/* Botón de continuar - Solo visible cuando la ronda está completada - a la derecha */}
          {roundCompleted && (
            <IonButton
              fill="clear"
              className="game2-check-button game2-continue-button"
              onClick={advanceToNextRound}
            >
              <img
                src={imgFlecha2}
                alt="Continuar"
                className="game2-check-button-image"
              />
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Game2;
