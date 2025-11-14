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
import GameHeader from './GameHeader';
import './Game2.css';

// Importar imágenes para el header
import imgAceptar from '/assets/juegosImg/game2/aceptar.png';
import imgVolver from '/assets/juegosImg/game2/volver.png';
import imgOrdenar from '/assets/juegosImg/game2/ordenar.png';
import imgJuego from '/assets/juegosImg/juegoX.png';

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
 * <Route path="/game2" component={Game2} />
 */
const Game2: React.FC = () => {
  const history = useHistory();
  const { user, loading: authLoading } = useAuth();

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
  const [availableNumbers, setAvailableNumbers] = useState<(number | undefined)[]>([]);
  const [orderedNumbers, setOrderedNumbers] = useState<(number | undefined)[]>([]);
  const [correctOrder, setCorrectOrder] = useState<number[]>([]);

  // Estados de UI
  const [showFeedback, setShowFeedback] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [hasErrors, setHasErrors] = useState(false);

  // Estados de resultados
  const [gameFinished, setGameFinished] = useState(false);

  // Estados de contadores por ronda
  const [attemptsCount, setAttemptsCount] = useState(0); // Contador de intentos (Repetir)
  const [hintsCount, setHintsCount] = useState(0); // Contador de pistas usadas

  // Mapeo de números a su posición original en availableNumbers
  const [originalPositions, setOriginalPositions] = useState<Map<number, number>>(new Map());

  // Estado para el elemento seleccionado (click mode)
  const [selectedNumber, setSelectedNumber] = useState<{
    value: number;
    source: 'available' | 'ordered';
    index: number;
  } | null>(null);

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
    setHasErrors(false);
    setSessionId(null);

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
        const dashboardRoute = user?.role === "student" ? '/student-dashboard' : '/tutor-dashboard';
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
   *
   * Flujo de ejecución:
   * 1. Genera números únicos aleatorios dentro del rango configurado
   * 2. Los ordena según configuración (ascendente/descendente)
   * 3. Mezcla los números disponibles para que no estén en orden
   * 4. Inicializa la zona de ordenamiento vacía
   * 5. Reinicia el timer de la ronda
   *
   * @returns void - Actualiza múltiples estados del componente
   *
   * @example
   * // Si config.settings.quantity = 5 y order = 'ascending':
   * // - Genera 5 números aleatorios
   * // - correctOrder = [1, 3, 5, 7, 9] (ordenados)
   * // - availableNumbers = [7, 1, 9, 3, 5] (mezclados)
   * // - orderedNumbers = [undefined, undefined, undefined, undefined, undefined]
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

    // Mezclar aleatoriamente los números disponibles (para que no estén en orden)
    const shuffledAvailable = [...numbersArray].sort(() => Math.random() - 0.5);

    // Guardar las posiciones originales de cada número
    const positions = new Map<number, number>();
    shuffledAvailable.forEach((num, index) => {
      positions.set(num, index);
    });

    // Crear array inicial vacío para la zona de ordenamiento
    const initialOrdered = new Array(quantity).fill(undefined);

    setAvailableNumbers(shuffledAvailable);
    setOrderedNumbers(initialOrdered);
    setOriginalPositions(positions);
    setShowFeedback(false);
    setRoundStartTime(Date.now());

    // Reiniciar contadores de ronda
    setAttemptsCount(0);
    setHintsCount(0);
  };


  /**
   * Valida la respuesta del usuario y muestra feedback visual.
   *
   * Flujo de ejecución:
   * 1. Calcula el tiempo transcurrido en la ronda
   * 2. Identifica errores y omisiones
   * 3. Muestra feedback visual (iconos check/cruz, colores)
   * 4. Si está correcto: guarda en BD y avanza automáticamente
   * 5. Si hay errores: solo muestra feedback, NO guarda (espera decisión del usuario)
   *
   * @returns Promesa que resuelve cuando se completa la validación
   *
   * @example
   * // Usuario coloca: [1, 3, 5, 7, 9] (correcto)
   * // → Guarda en BD con is_final_attempt: true y avanza automáticamente
   *
   * @example
   * // Usuario coloca: [1, 5, 3, 7, 9] (incorrecto)
   * // → Muestra feedback pero NO guarda, espera que usuario elija Repetir o Avanzar
   */
  const checkAnswer = async () => {
    const timeSeconds = (Date.now() - roundStartTime) / 1000;

    // Calcular omisiones (números que no colocó)
    const omissions = availableNumbers.filter(n => n !== undefined).length;

    // Identificar qué posiciones están incorrectas
    const wrongIndices = new Set<number>();
    orderedNumbers.forEach((num, index) => {
      if (correctOrder[index] !== undefined && num !== correctOrder[index]) {
        wrongIndices.add(index);
      }
    });

    // Solo es correcto si no hay errores NI omisiones
    const correct = wrongIndices.size === 0 && omissions === 0;
    const hasProblems = wrongIndices.size > 0 || omissions > 0;

    setShowFeedback(true);
    setHasErrors(hasProblems);

    // Solo guardar si está CORRECTO (avance automático)
    // Si hay errores, NO guardamos aquí, esperamos que el usuario decida (Repetir o Avanzar)
    if (correct && sessionId) {
      try {
        // Convertir undefined a -1 para que el backend pueda procesarlo
        const userOrderWithNulls = orderedNumbers.map(n => n ?? -1);

        await gamesAPI.saveRoundResult(sessionId, {
          round: currentRound,
          numbers: availableNumbers.filter((n): n is number => n !== undefined).concat(orderedNumbers.filter((n): n is number => n !== undefined)),
          user_order: userOrderWithNulls,
          correct_order: correctOrder,
          is_correct: true,
          time_seconds: timeSeconds,
          omissions: 0,
          is_final_attempt: true, // Es correcto, por lo tanto es intento final
          attempts: attemptsCount,
          hints: hintsCount
        });
      } catch (error) {
        console.error('Error saving round:', error);
      }
    }

    // Solo avanzar automáticamente si NO hay errores ni omisiones
    if (correct) {
      setTimeout(() => {
        if (currentRound < TOTAL_ROUNDS) {
          setCurrentRound(prev => prev + 1);
        } else {
          finishGame();
        }
      }, 2000);
    }
  };

  /**
   * Repite el ejercicio actual, manteniendo los números correctos en su posición
   * y devolviendo solo los incorrectos a la zona disponible en sus posiciones originales.
   */
  const repeatExercise = () => {
    // Incrementar contador de intentos
    setAttemptsCount(prev => prev + 1);

    const newOrdered = [...orderedNumbers];
    const newAvailable = [...availableNumbers];

    // Procesar cada número colocado
    orderedNumbers.forEach((num, index) => {
      if (num !== undefined) {
        // Verificar si el número está en la posición correcta
        const isCorrect = num === correctOrder[index];

        if (!isCorrect) {
          // Número incorrecto: devolverlo a su posición original en availableNumbers
          newOrdered[index] = undefined;

          // Obtener la posición original del número
          const originalIndex = originalPositions.get(num);

          if (originalIndex !== undefined && originalIndex < newAvailable.length) {
            // Si la posición original está disponible, colocar ahí
            if (newAvailable[originalIndex] === undefined) {
              newAvailable[originalIndex] = num;
            } else {
              // Si está ocupada, buscar la posición más cercana disponible
              let leftIndex = originalIndex - 1;
              let rightIndex = originalIndex + 1;
              let placed = false;

              while (!placed && (leftIndex >= 0 || rightIndex < newAvailable.length)) {
                if (leftIndex >= 0 && newAvailable[leftIndex] === undefined) {
                  newAvailable[leftIndex] = num;
                  placed = true;
                } else if (rightIndex < newAvailable.length && newAvailable[rightIndex] === undefined) {
                  newAvailable[rightIndex] = num;
                  placed = true;
                }
                leftIndex--;
                rightIndex++;
              }

              // Si no se encontró ninguna posición, buscar el primer vacío
              if (!placed) {
                const emptyIndex = newAvailable.findIndex(n => n === undefined);
                if (emptyIndex !== -1) {
                  newAvailable[emptyIndex] = num;
                }
              }
            }
          } else {
            // Si no hay posición original, buscar el primer slot vacío
            const emptyIndex = newAvailable.findIndex(n => n === undefined);
            if (emptyIndex !== -1) {
              newAvailable[emptyIndex] = num;
            }
          }
        }
        // Si es correcto, se mantiene en newOrdered (ya está copiado)
      }
    });

    setAvailableNumbers(newAvailable);
    setOrderedNumbers(newOrdered);
    setShowFeedback(false);
    setHasErrors(false);
    setRoundStartTime(Date.now());
  };

  /**
   * Proporciona una pista colocando automáticamente un número correcto.
   * Busca el primer slot vacío y coloca el número que debería ir ahí.
   */
  const useHint = () => {
    // No permitir pistas cuando se muestra feedback
    if (showFeedback) return;

    // Buscar el primer slot vacío en orderedNumbers
    const emptyIndex = orderedNumbers.findIndex(num => num === undefined);

    if (emptyIndex === -1) {
      // No hay slots vacíos
      return;
    }

    // Obtener el número correcto para esa posición
    const correctNumber = correctOrder[emptyIndex];

    // Buscar el número en availableNumbers
    const availableIndex = availableNumbers.findIndex(num => num === correctNumber);

    if (availableIndex === -1) {
      // El número no está disponible (ya está colocado en otro lugar)
      return;
    }

    // Incrementar contador de pistas
    setHintsCount(prev => prev + 1);

    // Mover el número de available a ordered
    const newAvailable = [...availableNumbers];
    newAvailable[availableIndex] = undefined;
    setAvailableNumbers(newAvailable);

    const newOrdered = [...orderedNumbers];
    newOrdered[emptyIndex] = correctNumber;
    setOrderedNumbers(newOrdered);

    // Deseleccionar cualquier número seleccionado
    setSelectedNumber(null);
  };

  /**
   * Avanza manualmente a la siguiente ronda o finaliza el juego.
   * Guarda el intento con errores como final antes de avanzar.
   *
   * Esta función se llama cuando el usuario hace clic en "Avanzar" después de ver
   * que su respuesta tiene errores. Es la PRIMERA y ÚNICA vez que se guarda este intento.
   */
  const advanceToNextRound = async () => {
    // Guardar el intento con errores como final (es la primera vez que se guarda)
    if (sessionId && hasErrors) {
      try {
        const timeSeconds = (Date.now() - roundStartTime) / 1000;
        const omissions = availableNumbers.filter(n => n !== undefined).length;

        // Convertir undefined a -1 para que el backend pueda procesarlo
        const userOrderWithNulls = orderedNumbers.map(n => n ?? -1);

        await gamesAPI.saveRoundResult(sessionId, {
          round: currentRound,
          numbers: availableNumbers.filter((n): n is number => n !== undefined).concat(orderedNumbers.filter((n): n is number => n !== undefined)),
          user_order: userOrderWithNulls,
          correct_order: correctOrder,
          is_correct: false, // Tiene errores o omisiones
          time_seconds: timeSeconds,
          omissions: omissions,
          is_final_attempt: true, // Usuario decidió avanzar, es intento final
          attempts: attemptsCount,
          hints: hintsCount
        });
      } catch (error) {
        console.error('Error saving final attempt:', error);
      }
    }

    // Avanzar a la siguiente ronda
    if (currentRound < TOTAL_ROUNDS) {
      setCurrentRound(prev => prev + 1);
    } else {
      finishGame();
    }
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
   * Guarda el estado actual como intento final y redirige al dashboard.
   */
  const handleEarlyExit = async () => {
    // Si hay una sesión activa, guardar el estado actual
    if (sessionId) {
      try {
        // Si hay números colocados en la ronda actual, guardar como intento incompleto
        const hasPlacedNumbers = orderedNumbers.some(num => num !== undefined);

        if (hasPlacedNumbers) {
          const timeSeconds = (Date.now() - roundStartTime) / 1000;
          const omissions = availableNumbers.filter(n => n !== undefined).length;
          const userOrderWithNulls = orderedNumbers.map(n => n ?? -1);

          await gamesAPI.saveRoundResult(sessionId, {
            round: currentRound,
            numbers: availableNumbers.filter((n): n is number => n !== undefined).concat(orderedNumbers.filter((n): n is number => n !== undefined)),
            user_order: userOrderWithNulls,
            correct_order: correctOrder,
            is_correct: false,
            time_seconds: timeSeconds,
            omissions: omissions,
            is_final_attempt: true,
            attempts: attemptsCount,
            hints: hintsCount
          });
        }

        // Finalizar la sesión
        const totalTimeSeconds = (Date.now() - gameStartTime) / 1000;
        await gamesAPI.finishGameSession(sessionId, totalTimeSeconds);
      } catch (error) {
        console.error('Error saving early exit:', error);
      }
    }

    // Redirigir al dashboard
    const dashboardRoute = student ? '/student-dashboard' : '/tutor-dashboard';
    history.push(dashboardRoute);
  };

  /**
   * Maneja el click en un número disponible (zona superior).
   * Solo permite seleccionar números de la zona disponible para colocarlos en la solución.
   */
  const handleAvailableNumberClick = (num: number, index: number) => {
    // No permitir seleccionar cuando se muestra feedback
    if (showFeedback) return;

    // Si se clickea el mismo número, deseleccionarlo
    if (selectedNumber?.source === 'available' && selectedNumber.index === index) {
      setSelectedNumber(null);
      return;
    }

    // Deseleccionar cualquier otro número y seleccionar este
    setSelectedNumber({ value: num, source: 'available', index });
  };

  /**
   * Maneja el click en un slot de la zona de ordenamiento.
   * - Si el slot está vacío y hay un número seleccionado: lo coloca
   * - Si el slot tiene un número: lo devuelve a su posición original en availableNumbers
   */
  const handleOrderedSlotClick = (targetIndex: number) => {
    // No permitir clicks cuando se muestra feedback
    if (showFeedback) return;

    const targetNumber = orderedNumbers[targetIndex];

    // Caso 1: El slot tiene un número - devolverlo a su posición original en availableNumbers
    if (targetNumber !== undefined) {
      const newOrdered = [...orderedNumbers];
      newOrdered[targetIndex] = undefined;
      setOrderedNumbers(newOrdered);

      const newAvailable = [...availableNumbers];
      // Obtener la posición original del número
      const originalIndex = originalPositions.get(targetNumber);

      if (originalIndex !== undefined && originalIndex < newAvailable.length) {
        // Si la posición original está disponible, colocar ahí
        if (newAvailable[originalIndex] === undefined) {
          newAvailable[originalIndex] = targetNumber;
        } else {
          // Si la posición original está ocupada, buscar la más cercana disponible
          let leftIndex = originalIndex - 1;
          let rightIndex = originalIndex + 1;
          let placed = false;

          while (!placed && (leftIndex >= 0 || rightIndex < newAvailable.length)) {
            if (leftIndex >= 0 && newAvailable[leftIndex] === undefined) {
              newAvailable[leftIndex] = targetNumber;
              placed = true;
            } else if (rightIndex < newAvailable.length && newAvailable[rightIndex] === undefined) {
              newAvailable[rightIndex] = targetNumber;
              placed = true;
            }
            leftIndex--;
            rightIndex++;
          }

          // Si no se encontró ninguna posición cercana, agregar al final
          if (!placed) {
            newAvailable.push(targetNumber);
          }
        }
      } else {
        // Si no hay posición original guardada, buscar el primer slot vacío
        const emptyIndex = newAvailable.findIndex(n => n === undefined);
        if (emptyIndex !== -1) {
          newAvailable[emptyIndex] = targetNumber;
        } else {
          newAvailable.push(targetNumber);
        }
      }

      setAvailableNumbers(newAvailable);

      // Deseleccionar si había algo seleccionado
      setSelectedNumber(null);
      return;
    }

    // Caso 2: El slot está vacío y hay un número seleccionado de available
    if (targetNumber === undefined && selectedNumber?.source === 'available') {
      // Mover desde available a ordered
      const newAvailable = [...availableNumbers];
      newAvailable[selectedNumber.index] = undefined;
      setAvailableNumbers(newAvailable);

      const newOrdered = [...orderedNumbers];
      newOrdered[targetIndex] = selectedNumber.value;
      setOrderedNumbers(newOrdered);

      // Deseleccionar después de colocar
      setSelectedNumber(null);
    }
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
    return <Redirect to="/student-login" />;
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

          {/* Números disponibles (arriba) */}
          <div className="available-numbers-top" id="available-zone">
            {availableNumbers.map((num, index) => {
              if (num === undefined) {
                // Mostrar slot vacío (no hace nada al hacer click)
                return (
                  <div
                    key={`available-slot-${index}`}
                    className="droppable-slot"
                  >
                    <div className="empty-slot" />
                  </div>
                );
              }

              const pictogramImg = usePictograms && num <= 10 ? PICTOGRAM_IMAGES[num] : null;
              let cardClass = 'number-card-v2 number-card-available';
              if (usePictograms) cardClass += ' number-card-pictogram';

              // Resaltar si está seleccionado
              const isSelected = selectedNumber?.source === 'available' && selectedNumber.index === index;
              if (isSelected) cardClass += ' number-card-selected';

              return (
                <div
                  key={`available-${num}-${index}`}
                  className={cardClass}
                  onClick={() => handleAvailableNumberClick(num, index)}
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

          {/* Zona de ordenamiento (abajo con espacios grises) */}
          <DropZone
            numbers={orderedNumbers}
            correctOrder={correctOrder}
            showFeedback={showFeedback}
            totalSlots={orderedNumbers.length}
            usePictogram={usePictograms}
            lockedIndices={new Set()}
            selectedNumber={selectedNumber}
            onSlotClick={handleOrderedSlotClick}
          />
        </div>

        {/* Botones de control */}
        <div className="check-button-container">
          {/* Botón de pistas - siempre visible a la izquierda */}
          <IonButton
            fill="clear"
            className="game2-check-button game2-hint-button"
            onClick={useHint}
            disabled={showFeedback}
          >
            <span className="hint-button-text">💡</span>
          </IonButton>

          {/* Mostrar botón Repetir solo cuando hay errores y se muestra feedback */}
          {showFeedback && hasErrors && (
            <IonButton
              fill="clear"
              className="game2-check-button game2-repeat-button"
              onClick={repeatExercise}
            >
              <img
                src={imgVolver}
                alt="Repetir"
                className="game2-check-button-image"
              />
            </IonButton>
          )}

          {/* Botón Aceptar/Comprobar cuando no hay feedback */}
          {!showFeedback && (
            <IonButton
              fill="clear"
              className="game2-check-button"
              onClick={checkAnswer}
            >
              <img
                src={imgAceptar}
                alt="Comprobar"
                className="game2-check-button-image"
              />
            </IonButton>
          )}

          {/* Botón Flecha para continuar cuando está correcto */}
          {showFeedback && !hasErrors && (
            <IonButton
              fill="clear"
              className="game2-check-button"
              onClick={() => {
                if (currentRound < TOTAL_ROUNDS) {
                  setCurrentRound(prev => prev + 1);
                } else {
                  finishGame();
                }
              }}
            >
              <img
                src={imgFlecha2}
                alt="Continuar"
                className="game2-check-button-image"
              />
            </IonButton>
          )}

          {/* Botón Flecha para avanzar cuando hay errores */}
          {showFeedback && hasErrors && (
            <IonButton
              fill="clear"
              className="game2-check-button"
              onClick={advanceToNextRound}
            >
              <img
                src={imgFlecha2}
                alt="Avanzar"
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
