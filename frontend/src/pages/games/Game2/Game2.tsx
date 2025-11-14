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
import Game2Header from '../Game2Header';
import './Game2.css';

// Importar imágenes para el header
import imgAceptar from '/assets/juegosImg/aceptar.png';
import imgVolver from '/assets/juegosImg/volver.png';
import imgOrdenar from '/assets/juegosImg/game2/ordenar.png';
import imgJuego from '/assets/juegosImg/juegoX.png';

// Flecha desde assets
const imgFlecha = '/assets/juegosImg/flecha.png';

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
  const [lockedIndices, setLockedIndices] = useState<Set<number>>(new Set());

  // Estados de UI
  const [showFeedback, setShowFeedback] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [hasErrors, setHasErrors] = useState(false);
  const [incorrectIndices, setIncorrectIndices] = useState<Set<number>>(new Set());

  // Estados de resultados
  const [gameFinished, setGameFinished] = useState(false);

  // Determinar si usar pictogramas (solo para rango 0-10)
  const usePictograms = config?.number_range === '0-10';

  // Cargar configuración al montar (solo una vez)
  useEffect(() => {
    loadGameConfig();
    setGameStartTime(Date.now());
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

  /**
   * Listener de eventos personalizados 'number-dropped' disparados por DroppableSlot.
   *
   * Maneja tres casos de drag & drop:
   * 1. **'available'**: Número arrastrado desde zona superior → zona de ordenamiento
   * 2. **'ordered'**: Número reordenado dentro de la zona de ordenamiento
   * 3. **'return-to-available'**: Número devuelto desde zona ordenamiento → zona superior
   *
   * Lógica de intercambio:
   * - Si el slot de destino tiene número, lo desplaza al primer slot vacío disponible
   * - No permite mover números bloqueados (ayuda pre-colocada)
   * - Mantiene slots vacíos persistentes para permitir devolver números
   *
   * Custom Event :
   * ```typescript
   * {
   *   number: 5,              // Número arrastrado
   *   targetIndex: 2,         // Índice de destino
   *   sourceType: 'ordered',  // Origen del drag
   *   sourceIndex?: 1         // Índice de origen (solo para return-to-available)
   * }
   * ```
   */
  useEffect(() => {
    const handleNumberDropped = (e: Event) => {
      // No permitir mover números cuando se muestra feedback
      if (showFeedback) {
        return;
      }

      const customEvent = e as CustomEvent;
      const { number, targetIndex, sourceType, sourceIndex } = customEvent.detail;

      // Caso 1: Número viene de availableNumbers (zona superior)
      if (sourceType === 'available') {
        const availableIndex = availableNumbers.findIndex(n => n === number);
        if (availableIndex !== -1) {
          // Marcar posición como vacía en available
          const newAvailable = [...availableNumbers];
          newAvailable[availableIndex] = undefined;
          setAvailableNumbers(newAvailable);

          const newOrdered = [...orderedNumbers];

          // Si hay un número en esa posición, devolverlo a available
          if (newOrdered[targetIndex] !== undefined) {
            const displaced = newOrdered[targetIndex];
            // Encontrar el primer slot vacío en available o agregar al final
            const emptyAvailableIndex = newAvailable.findIndex(n => n === undefined);
            if (emptyAvailableIndex !== -1) {
              newAvailable[emptyAvailableIndex] = displaced;
            } else {
              newAvailable.push(displaced);
            }
            setAvailableNumbers(newAvailable);
          }

          newOrdered[targetIndex] = number;
          setOrderedNumbers(newOrdered);
        }
      }
      // Caso 2: Número viene de orderedNumbers (reordenar o devolver a available)
      else if (sourceType === 'ordered') {
        const oldIndex = orderedNumbers.indexOf(number);

        // No permitir mover números bloqueados
        if (lockedIndices.has(oldIndex)) {
          return;
        }

        if (oldIndex !== -1) {
          const newOrdered = [...orderedNumbers];

          if (targetIndex !== undefined && targetIndex !== oldIndex) {
            // Intercambiar posiciones en ordered (solo si el destino no está bloqueado)
            if (!lockedIndices.has(targetIndex)) {
              const temp = newOrdered[targetIndex];
              newOrdered[targetIndex] = number;
              newOrdered[oldIndex] = temp;

              setOrderedNumbers(newOrdered);
            }
          }
        }
      }
      // Caso 3: Devolver número de ordered a available
      else if (sourceType === 'return-to-available') {
        const oldIndex = orderedNumbers.indexOf(number);

        // No permitir mover números bloqueados
        if (lockedIndices.has(oldIndex)) {
          return;
        }

        if (oldIndex !== -1) {
          const newOrdered = [...orderedNumbers];
          newOrdered[oldIndex] = undefined;
          setOrderedNumbers(newOrdered);

          const newAvailable = [...availableNumbers];
          if (sourceIndex !== undefined && sourceIndex < newAvailable.length) {
            newAvailable[sourceIndex] = number;
          } else {
            // Encontrar el primer slot vacío o agregar al final
            const emptyIndex = newAvailable.findIndex(n => n === undefined);
            if (emptyIndex !== -1) {
              newAvailable[emptyIndex] = number;
            } else {
              newAvailable.push(number);
            }
          }
          setAvailableNumbers(newAvailable);
        }
      }
    };

    window.addEventListener('number-dropped', handleNumberDropped);
    return () => window.removeEventListener('number-dropped', handleNumberDropped);
  }, [availableNumbers, orderedNumbers, lockedIndices, showFeedback]);

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
   * 1. Calcula cantidad total: números a ordenar (quantity) + números de ayuda (40%)
   * 2. Genera números únicos aleatorios dentro del rango configurado
   * 3. Los ordena según configuración (ascendente/descendente)
   * 4. Selecciona aleatoriamente qué números serán "ayuda" (pre-colocados y bloqueados)
   * 5. Mezcla los números disponibles para que no estén en orden
   * 6. Coloca números de ayuda en sus posiciones correctas (verdes y bloqueados)
   * 7. Reinicia el timer de la ronda
   *
   * @returns void - Actualiza múltiples estados del componente
   *
   * @example
   * // Si config.settings.quantity = 5 y order = 'ascending':
   * // - Genera 7 números (5 + 2 de ayuda)
   * // - correctOrder = [1, 3, 5, 7, 9, 10, 15] (ordenados)
   * // - availableNumbers = [7, 1, 15, 9, 3] (mezclados, sin ayuda)
   * // - orderedNumbers = [undefined, undefined, 5, undefined, undefined, 10, undefined]
   * // - lockedIndices = Set(2, 5) (posiciones bloqueadas)
   */
  const generateRound = () => {
    if (!config) return;

    const [min, max] = config.number_range.split('-').map(Number);

    // Validar que min y max sean números válidos
    if (isNaN(min) || isNaN(max) || min >= max) {
      console.error('Invalid number range:', config.number_range);
      return;
    }

    const quantity = config.settings.quantity || 5; // números que el usuario debe colocar

    // Validar que quantity sea un número válido
    if (isNaN(quantity) || quantity <= 0) {
      console.error('Invalid quantity:', config.settings.quantity);
      return;
    }

    // Calcular números disponibles en el rango
    const availableInRange = max - min + 1;

    // Calcular números de ayuda (40% de quantity, redondeado)
    const helpCount = Math.ceil(quantity * 0.4);
    //const helpCount =0;

    // Total de números = números a colocar + números de ayuda
    const totalNumbers = quantity + helpCount;

    // Validar que no se pidan más números de los disponibles en el rango
    if (totalNumbers > availableInRange) {
      console.error(
        `Cannot generate ${totalNumbers} unique numbers from range ${min}-${max} (only ${availableInRange} available). ` +
        `Please reduce quantity or increase range.`
      );
      // Ajustar totalNumbers al máximo disponible
      const adjustedTotal = availableInRange;
      const adjustedQuantity = Math.floor(adjustedTotal * 0.7); // 70% para el usuario
      const adjustedHelp = adjustedTotal - adjustedQuantity;

      console.warn(`Adjusting: quantity=${adjustedQuantity}, help=${adjustedHelp}, total=${adjustedTotal}`);

      // Usar todos los números del rango
      const numbers = new Set<number>();
      for (let i = min; i <= max; i++) {
        numbers.add(i);
      }

      const numbersArray = Array.from(numbers);

      // Ordenar todos los números según configuración
      const sorted = [...numbersArray].sort((a, b) =>
        config.settings.order === 'ascending' ? a - b : b - a
      );

      // Crear array de orden correcto
      const fullOrder = [...sorted];
      setCorrectOrder(fullOrder);

      // Seleccionar aleatoriamente qué números serán de ayuda (bloqueados)
      const allIndices = Array.from({ length: adjustedTotal }, (_, i) => i);
      const shuffledIndices = allIndices.sort(() => Math.random() - 0.5);
      const lockedPositions = shuffledIndices.slice(0, adjustedHelp);

      // Separar números bloqueados y disponibles
      const lockedNumbers: number[] = [];
      const availableNums: number[] = [];

      sorted.forEach((num, index) => {
        if (lockedPositions.includes(index)) {
          lockedNumbers.push(num);
        } else {
          availableNums.push(num);
        }
      });

      // Mezclar aleatoriamente los números disponibles
      const shuffledAvailable = availableNums.sort(() => Math.random() - 0.5);

      // Crear array inicial con números bloqueados en sus posiciones correctas
      const initialOrdered = new Array(adjustedTotal).fill(undefined);
      const fixedIndices = new Set<number>();

      // Colocar números de ayuda bloqueados en sus posiciones correctas
      lockedNumbers.forEach((num) => {
        const correctPos = sorted.indexOf(num);
        fixedIndices.add(correctPos);
        initialOrdered[correctPos] = num;
      });

      setAvailableNumbers(shuffledAvailable);
      setOrderedNumbers(initialOrdered);
      setLockedIndices(fixedIndices);
      setShowFeedback(false);
      setRoundStartTime(Date.now());
      return;
    }

    // Generar totalNumbers números únicos aleatorios
    const numbers = new Set<number>();
    while (numbers.size < totalNumbers) {
      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      numbers.add(randomNum);
    }

    const numbersArray = Array.from(numbers);

    // Ordenar todos los números según configuración
    const sorted = [...numbersArray].sort((a, b) =>
      config.settings.order === 'ascending' ? a - b : b - a
    );

    // Crear array de orden correcto (todos los números en orden, sin espacios vacíos)
    const fullOrder = [...sorted];
    setCorrectOrder(fullOrder);

    // Seleccionar aleatoriamente qué números serán de ayuda (bloqueados)
    const allIndices = Array.from({ length: totalNumbers }, (_, i) => i);
    const shuffledIndices = allIndices.sort(() => Math.random() - 0.5);
    const lockedPositions = shuffledIndices.slice(0, helpCount);

    // Separar números bloqueados y disponibles según las posiciones aleatorias
    const lockedNumbers: number[] = [];
    const availableNums: number[] = [];

    sorted.forEach((num, index) => {
      if (lockedPositions.includes(index)) {
        lockedNumbers.push(num);
      } else {
        availableNums.push(num);
      }
    });

    // Mezclar aleatoriamente los números disponibles (para que no estén en orden)
    const shuffledAvailable = availableNums.sort(() => Math.random() - 0.5);

    // Crear array inicial con números bloqueados en sus posiciones correctas
    const initialOrdered = new Array(totalNumbers).fill(undefined);
    const fixedIndices = new Set<number>();

    // Colocar números de ayuda bloqueados en sus posiciones correctas
    lockedNumbers.forEach((num) => {
      const correctPos = sorted.indexOf(num);
      fixedIndices.add(correctPos);
      initialOrdered[correctPos] = num;
    });

    setAvailableNumbers(shuffledAvailable);
    setOrderedNumbers(initialOrdered);
    setLockedIndices(fixedIndices);
    setShowFeedback(false);
    setRoundStartTime(Date.now());
  };


  /**
   * Valida la respuesta del usuario y guarda el resultado de la ronda.
   *
   * Flujo de ejecución:
   * 1. Verifica que todos los números disponibles fueron colocados
   * 2. Calcula el tiempo transcurrido en la ronda
   * 3. Compara el orden del usuario con el orden correcto (posición por posición)
   * 4. Muestra feedback visual (botón verde/rojo, iconos check/cruz)
   * 5. Si hay errores, NO avanza automáticamente (muestra botones Repetir/Avanzar)
   * 6. Si todo está correcto, avanza automáticamente tras 2 segundos
   * 7. Guarda el resultado en el backend vía API
   *
   * @returns Promesa que resuelve cuando se completa la validación
   *
   * @example
   * // Usuario coloca: [1, 3, 5, 7, 9]
   * // Orden correcto: [1, 3, 5, 7, 9]
   * // → is_correct = true, muestra botón verde "¡Correcto!"
   * // → Guarda en BD y avanza a ronda 2
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
    setIncorrectIndices(wrongIndices);

    // Guardar en el backend
    // is_final_attempt = false cuando hay errores o omisiones (puede repetir)
    // is_final_attempt = true cuando todo está correcto (avanza automático)
    if (sessionId) {
      try {
        // Convertir undefined a -1 para que el backend pueda procesarlo
        const userOrderWithNulls = orderedNumbers.map(n => n ?? -1);

        await gamesAPI.saveRoundResultGame2(sessionId, {
          round: currentRound,
          numbers: availableNumbers.filter((n): n is number => n !== undefined).concat(orderedNumbers.filter((n): n is number => n !== undefined)),
          user_order: userOrderWithNulls,
          correct_order: correctOrder,
          is_correct: correct,
          time_seconds: timeSeconds,
          omissions: omissions,
          is_final_attempt: correct // Solo es final si está todo correcto
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
   * Repite el ejercicio actual, manteniendo solo las posiciones correctas bloqueadas.
   * Las posiciones incorrectas Y los números omitidos se devuelven a la zona de disponibles.
   */
  const repeatExercise = () => {
    // Crear nuevo array de números disponibles con:
    // - Números incorrectos (mal colocados)
    // - Números omitidos (que no colocó)
    const newAvailable: (number | undefined)[] = [];
    const newOrdered = [...orderedNumbers];
    const newLockedIndices = new Set<number>(lockedIndices);

    // Agregar números incorrectos
    orderedNumbers.forEach((num, index) => {
      if (num !== undefined && incorrectIndices.has(index)) {
        // Este número estaba mal, devolverlo a disponibles
        newAvailable.push(num);
        newOrdered[index] = undefined;
      } else if (num !== undefined && !lockedIndices.has(index)) {
        // Este número estaba bien, bloquearlo en su posición
        newLockedIndices.add(index);
      }
    });

    // Agregar números omitidos (que estaban en availableNumbers)
    availableNumbers.forEach(num => {
      if (num !== undefined) {
        newAvailable.push(num);
      }
    });

    // Mezclar todos los números que hay que volver a colocar
    const shuffledAvailable = newAvailable.sort(() => Math.random() - 0.5);

    setAvailableNumbers(shuffledAvailable);
    setOrderedNumbers(newOrdered);
    setLockedIndices(newLockedIndices);
    setShowFeedback(false);
    setHasErrors(false);
    setIncorrectIndices(new Set());
    setRoundStartTime(Date.now());
  };

  /**
   * Avanza manualmente a la siguiente ronda o finaliza el juego.
   * Guarda el intento actual como final antes de avanzar.
   */
  const advanceToNextRound = async () => {
    // El último intento ya fue guardado en checkAnswer() con is_final_attempt: false
    // Ahora lo guardamos nuevamente marcado como final para actualizar contadores
    if (sessionId && hasErrors) {
      try {
        const timeSeconds = (Date.now() - roundStartTime) / 1000;
        const omissions = availableNumbers.filter(n => n !== undefined).length;

        // Convertir undefined a -1 para que el backend pueda procesarlo
        const userOrderWithNulls = orderedNumbers.map(n => n ?? -1);

        await gamesAPI.saveRoundResultGame2(sessionId, {
          round: currentRound,
          numbers: availableNumbers.filter((n): n is number => n !== undefined).concat(orderedNumbers.filter((n): n is number => n !== undefined)),
          user_order: userOrderWithNulls,
          correct_order: correctOrder,
          is_correct: false, // Tiene errores o omisiones
          time_seconds: timeSeconds,
          omissions: omissions,
          is_final_attempt: true // Marcar como final para actualizar contadores
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
        <Game2Header
          title="Ordenar Nº"
          pictogram1={imgOrdenar}
          pictogramArrow={imgFlecha}
          pictogram2={imgJuego}
          currentRound={currentRound}
          totalRounds={TOTAL_ROUNDS}
        />



        {/* Zona de juego */}
        <div className="game2-container">
          {/* Instrucción con pictograma 
          <div className="instruction-header">
            <IonText>
              <h3 className="instruction-text">
                {config?.settings.order === 'ascending' ? '→' : '←'}
              </h3>
            </IonText>
          </div>
            */}

          {/* Números disponibles (arriba) */}
          <div className="available-numbers-top" id="available-zone">
            {availableNumbers.map((num, index) => {
              if (num === undefined) {
                // Mostrar slot vacío con zona droppable
                return (
                  <div
                    key={`available-slot-${index}`}
                    className="droppable-slot"
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const numberStr = e.dataTransfer.getData('number');
                      const sourceType = e.dataTransfer.getData('sourceType');

                      if (numberStr !== '' && sourceType === 'ordered') {
                        const droppedNumber = parseInt(numberStr);
                        // Disparar evento para devolver número a available
                        window.dispatchEvent(new CustomEvent('number-dropped', {
                          detail: {
                            number: droppedNumber,
                            sourceType: 'return-to-available',
                            sourceIndex: index
                          }
                        }));
                      }
                    }}
                  >
                    <div className="empty-slot" />
                  </div>
                );
              }

              const pictogramImg = usePictograms && num <= 10 ? PICTOGRAM_IMAGES[num] : null;
              let cardClass = 'number-card-v2 number-card-available';
              if (usePictograms) cardClass += ' number-card-pictogram';

              return (
                <div
                  key={`available-${num}-${index}`}
                  className={cardClass}
                  draggable={!showFeedback}
                  onDragStart={(e) => {
                    if (showFeedback) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('number', num.toString());
                    e.dataTransfer.setData('sourceType', 'available');
                  }}
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
            lockedIndices={lockedIndices}
          />
        </div>

        {/* Botones de control */}
        <div className="check-button-container">
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

          {/* Botón Aceptar/Comprobar (o Avanzar cuando hay errores) */}
          <IonButton
            fill="clear"
            className="game2-check-button"
            onClick={showFeedback && hasErrors ? advanceToNextRound : checkAnswer}
            disabled={showFeedback && !hasErrors}
          >
            <img
              src={imgAceptar}
              alt={showFeedback && hasErrors ? "Avanzar" : "Comprobar"}
              className="game2-check-button-image"
            />
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Game2;
