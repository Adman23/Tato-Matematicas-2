/**
 * @file Game2.tsx
 * @description Juego 2: Ordena la Secuencia
 *
 * Juego educativo que presenta números desordenados que el usuario debe
 * ordenar arrastrándolos a sus posiciones correctas (ascendente o descendente).
 *
 * Flujo del juego:
 * 1. Carga configuración personalizada del usuario (rango, cantidad, orden)
 * 2. Crea sesión de juego en backend para tracking
 * 3. Por cada ronda (5 totales):
 *    - Genera números aleatorios según configuración
 *    - Usuario arrastra números a posiciones correctas
 *    - Valida en tiempo real y guarda resultado
 * 4. Finaliza sesión y muestra pantalla de resultados
 *
 * Características:
 * - Drag & drop nativo HTML5 + soporte táctil
 * - Slots vacíos persistentes
 * - Pictogramas visuales para rango 0-10
 * - Sistema de pistas (Tato)
 * - Video tutorial integrado
 * - Tracking completo (tiempo, intentos, errores)
 *
 * @returns Componente React con UI completa del juego
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonButton,
  IonText,
  IonSpinner,
  useIonRouter
} from '@ionic/react';
import { Redirect, useLocation } from 'react-router-dom';

import { useAuth } from '../../../contexts/AuthContext';
import { useUserData } from '../../../contexts/UserContext';
import { gamesAPI, getAudioPreferences, type AudioPreferences } from '../../../lib/api';
import type { GameConfig, StudentMessage } from '../../../lib/api';
import DropZone from './DropZone';
import GameHeader from '../components/GameHeader';
import FeedbackScreen from '../components/FeedbackScreen';
import ResultsScreen from '../components/ResultsScreen';
import ExitScreen from '../components/ExitScreen';
import './Game2.css';
import { GameControlButton } from '../../global_components/GameControlButton';

// Importar imágenes para el header
import imgOrdenar from '/assets/juegosImg/game2/ordenar.png';
import imgJuego from '/assets/juegosImg/juegoX.png';
import imgTato from '/assets/Tato/TatoPista.png';
import imgTatoFeliz from '/assets/Tato/TatoFeliz.png';
import imgTatoTriste from '/assets/Tato/TatoTriste.png';
import imgSiguiente from '/assets/juegosImg/siguiente.png';
import imgInstrucciones from '/assets/juegosImg/instrucciones.png';

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
 * Componente principal del Juego 2: Ordena la Secuencia.
 *
 * Resumen funcional:
 * Juego educativo de ordenamiento de números mediante drag & drop. El usuario
 * debe colocar números desordenados en el orden correcto (ascendente o descendente)
 * arrastrándolos uno por uno a los slots disponibles.
 *
 * Flujo de ejecución:
 * 1. Carga configuración personalizada (`loadGameConfig`)
 * 2. Crea sesión en backend (`createGameSession`)
 * 3. Genera 5 rondas con números aleatorios (`generateRound`)
 * 4. Valida cada colocación en tiempo real (`tryPlaceNumber`)
 * 5. Guarda resultados de cada ronda (`saveRoundResults`)
 * 6. Finaliza sesión y muestra resultados (`finishGame`)
 *
 * Contrato mínimo:
 * - Entradas: configuración del juego (rango, cantidad, orden) y acciones del usuario
 * - Salidas: llamadas API para crear sesión, guardar rondas y finalizar sesión
 * - Modos de error: manejo de errores de red y configuración por defecto
 *
 * @returns Componente React que renderiza la UI completa del juego
 *
 * @example
 * // Usado en el routing de la app:
 * <Route path="/game/game2" component={Game2} />
 */
const Game2: React.FC = () => {

  const location = useLocation();
  const router = useIonRouter();
  const { user, loadingAuth: authLoading } = useAuth();
  const { getAllMessages, refreshUserData, loadingUser } = useUserData();

  // Determinar el usuario actual (puede ser estudiante o profesor)
  const currentUser = user;

  // Flag para prevenir creación duplicada de sesión (React 18 StrictMode)
  const sessionCreatedRef = useRef(false);

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [audioPreferences, setAudioPreferences] = useState<AudioPreferences | undefined>();

  // Estados del juego
  const [currentRound, setCurrentRound] = useState(1);
  const [availableNumbers, setAvailableNumbers] = useState<(number | undefined)[]>([]); // Grid fijo con números o undefined
  const [orderedNumbers, setOrderedNumbers] = useState<(number | undefined)[]>([]);
  const [correctOrder, setCorrectOrder] = useState<number[]>([]);
  const [initialNumbers, setInitialNumbers] = useState<number[]>([]); // Números iniciales desordenados de la ronda

  // Estados de UI
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFeedbackScreen, setShowFeedbackScreen] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
  const [draggingNumber, setDraggingNumber] = useState<number | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  // Estados para touch events (mobile/tablet)
  //const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);

  // Video modal state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Estados de resultados
  const [gameFinished, setGameFinished] = useState(false);
  const [isRoundCompleted, setIsRoundCompleted] = useState(false); // Si la ronda se completó

  // Estados de contadores por ronda
  const [hintsCount, setHintsCount] = useState(0); // Contador de pistas usadas
  const [errorsCount, setErrorsCount] = useState(0); // Contador de errores (colocaciones incorrectas)
  const [totalHintsUsed, setTotalHintsUsed] = useState(0); // Acumulado de pistas usadas en la partida
  const [totalErrorsMade, setTotalErrorsMade] = useState(0); // Acumulado de errores en la partida
  const [roundTimes, setRoundTimes] = useState<number[]>([]); // Tiempos por ronda
  const [totalNumbersCorrect, setTotalNumbersCorrect] = useState(0); // Aciertos totales (números bien colocados)
  const [totalNumbersRequired, setTotalNumbersRequired] = useState(0); // Números totales jugados
  const [exiting, setExiting] = useState(false); // Evita recrear sesión al salir

  // Estados de mensajes personalizados
  const [Messages, setMessages] = useState<StudentMessage[]>([]);

  // Estado de confirmación de salida
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Determinar si usar pictogramas (solo para rango 0-10)
  const usePictograms = config?.number_range === '0-10';

  // Pre-carga de imágenes para evitar que los slots aparezcan vacíos mientras se descargan
  useEffect(() => {
    const pictogramUrls = Object.values(PICTOGRAM_IMAGES);
    const uiAssets = [
      imgOrdenar,
      imgJuego,
      imgTato,
      imgTatoFeliz,
      imgTatoTriste,
      imgSiguiente,
      imgInstrucciones,
      imgFlecha
    ];

    const preloaded: HTMLImageElement[] = [];

    [...pictogramUrls, ...uiAssets].forEach((src) => {
      const img = new Image();
      img.src = src;
      preloaded.push(img);
    });

    return () => {
      preloaded.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, []);

  // Cargar configuración al montar (solo una vez)
  // Se ejecuta cada vez que cambia la ubicación para forzar reseteo completo
  useEffect(() => {
    // Resetear el ref de sesión al montar el componente
    sessionCreatedRef.current = false;

    setExiting(false);
    // Resetear TODOS los estados al entrar al juego
    setGameFinished(false);
    setCurrentRound(1);
    setShowFeedback(false);
    setShowFeedbackScreen(false);
    setFeedbackType(null);
    setSessionId(null);
    setAvailableNumbers([]);
    setOrderedNumbers([]);
    setCorrectOrder([]);
    setInitialNumbers([]);
    setDraggingNumber(null);
    setSelectedNumber(null);
    setIsRoundCompleted(false);
    setShowVideoModal(false);

    // Resetear contadores
    setHintsCount(0);
    setErrorsCount(0);
    setTotalHintsUsed(0);
    setTotalErrorsMade(0);
    setRoundTimes([]);
    setTotalNumbersCorrect(0);
    setTotalNumbersRequired(0);

    loadGameConfig();
    setGameStartTime(Date.now());

    // Cleanup al desmontar: resetear TODOS los estados
    return () => {
      sessionCreatedRef.current = false;
      setGameFinished(false);
      setCurrentRound(1);
      setShowFeedback(false);
      setShowFeedbackScreen(false);
      setFeedbackType(null);
      setSessionId(null);
      setAvailableNumbers([]);
      setOrderedNumbers([]);
      setCorrectOrder([]);
      setInitialNumbers([]);
      setDraggingNumber(null);
      setSelectedNumber(null);
      setIsRoundCompleted(false);
      setShowVideoModal(false);
      setHintsCount(0);
      setErrorsCount(0);
      setTotalHintsUsed(0);
      setTotalErrorsMade(0);
      setRoundTimes([]);
      setTotalNumbersCorrect(0);
      setTotalNumbersRequired(0);
      //setTouchStartPos(null);

      // Limpiar elemento drag si existe
      const dragClone = document.getElementById('touch-drag-clone');
      if (dragClone && dragClone.parentNode) {
        dragClone.parentNode.removeChild(dragClone);
      }
      setDraggedElement(null);
    };
  },
    [location.pathname]); // Se ejecuta cuando cambia la ruta

  // Crear sesión cuando la configuración esté cargada (solo una vez)
  useEffect(() => {
    if (config && !sessionId && !sessionCreatedRef.current) {
      sessionCreatedRef.current = true;
      createGameSession();
    }

  }, [config]);

  // Generar nueva ronda cuando cambia currentRound
  useEffect(() => {
    if (exiting) return;
    if (config && currentRound <= TOTAL_ROUNDS) {
      generateRound();
    }

  }, [config, currentRound, exiting]);

  // Cargar mensajes personalizados cuando el UserContext termine de cargar
  useEffect(() => {
    if (loadingUser) return;
    loadPositiveMessages();
  }, [loadingUser]); // Solo depende de loadingUser para evitar loops

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
    if (exiting) return;
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

      // Cargar preferencias de audio del usuario
      try {
        const audioPrefs = await getAudioPreferences(currentUser.id);
        setAudioPreferences(audioPrefs);
      } catch (err) {
        console.error('Error loading audio preferences:', err);
      }
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
    if (exiting) return;
    try {
      if (!currentUser?.id) return;

      const data = await gamesAPI.createGameSession(currentUser.id, 'order_sequence');
      setSessionId(data.session_id);
    } catch (error) {
      console.error('Error creating game session:', error);
    }
  };

  /**
   * Resumen funcional:
   * Carga los mensajes personalizados de feedback desde el UserContext.
   *
   * Flujo de ejecución:
   * 1. Espera a que el UserContext termine de cargar
   * 2. Obtiene los mensajes normalizados desde `getAllMessages()`
   * 3. Si no hay mensajes, refresca los datos del usuario
   * 4. Actualiza el estado con los mensajes personalizados
   *
   * @returns Promise<void> que resuelve cuando se cargan los mensajes
   *
   * @example
   * await loadPositiveMessages();
   */
  const loadPositiveMessages = async () => {
    try {
      if (!currentUser?.id) return;

      // Intenta obtener mensajes del contexto (ya normalizados)
      let data = getAllMessages?.() || [];
      console.log('Loaded messages from context:', data);

      /*
      // Si no hay mensajes en el contexto, recarga los datos del usuario
      if ((!data || data.length === 0) && refreshUserData) {
        await refreshUserData();
        data = getAllMessages?.() || [];
      }
      */

      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback a mensajes por defecto
      const defaultMessages: StudentMessage[] = [
        { id: "0", type: 'positive', text_message: '¡Muy bien!' },
        { id: "1", type: 'reinforcement', text_message: '¡Inténtalo de nuevo!' }
      ];
      setMessages(defaultMessages);
    }
  };

  /**
   * Resumen funcional:
   * Genera los números y configuración para una nueva ronda del juego.
   *
   * Flujo de ejecución:
   * 1. Extrae y valida el rango de números de la configuración
   * 2. Genera números únicos aleatorios según la cantidad configurada
   * 3. Ordena los números según configuración (ascendente/descendente)
   * 4. Mezcla los números para mostrar en zona superior
   * 5. Crea array vacío para zona de ordenamiento
   * 6. Reinicia contadores y estados de la ronda
   *
   * @returns void - Actualiza estados: currentNumber, availableNumbers, correctOrder, etc.
   *
   * @example
   * generateRound();
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
    setIsRoundCompleted(false);
    setSelectedNumber(null); // Resetear número seleccionado

    // Reiniciar contadores de ronda
    setHintsCount(0);
    setErrorsCount(0);
  };


  /**
   * Resumen funcional:
   * Intenta colocar un número arrastrado en el primer slot vacío disponible
   * y valida si es correcto en tiempo real.
   *
   * Flujo de ejecución:
   * 1. Verifica que el slot objetivo es el primer slot vacío
   * 2. Comprueba si el número es correcto para esa posición
   * 3. Si es incorrecto, muestra feedback de error e incrementa contador
   * 4. Si es correcto, coloca el número y lo quita de availableNumbers
   * 5. Si todos los números están colocados, guarda resultados de la ronda
   *
   * @param draggedNumber - Número que se está intentando colocar
   * @param targetIndex - Índice del slot objetivo
   * @param currentHints - Valor actual de hints para evitar problemas de estado asíncrono
   * @param isHint - Si true, no muestra feedback (es una pista automática)
   * @returns void
   *
   * @example
   * tryPlaceNumber(5, 0);
   */
  const tryPlaceNumber = (draggedNumber: number, targetIndex: number, currentHints?: number, isHint: boolean = false) => {
    if (showFeedback) return;

    // Asegurar que draggedNumber es un número (no string)
    const numericDragged = typeof draggedNumber === 'number' ? draggedNumber : Number(draggedNumber);

    // Buscar el primer slot vacío
    const firstEmptyIndex = orderedNumbers.findIndex(n => n === undefined);

    // Solo se puede colocar en el primer slot vacío
    if (targetIndex !== firstEmptyIndex) return;

    // Verificar si el número es correcto para esta posición
    const isCorrect = numericDragged === correctOrder[firstEmptyIndex];

    if (!isCorrect) {
      // Mostrar pantalla de feedback con error
      setFeedbackType('incorrect');
      setShowFeedbackScreen(true);
      setErrorsCount(prev => prev + 1); // Incrementar contador de errores
      return;
    }

    // Es correcto: colocar el número y quitarlo de availableNumbers
    const newOrdered = [...orderedNumbers];
    newOrdered[firstEmptyIndex] = numericDragged;
    setOrderedNumbers(newOrdered);

    // Reemplazar el número con undefined en availableNumbers (mantener posición fija)
    // Usar comparación estricta de tipos para asegurar que funciona con 0
    const newAvailable = availableNumbers.map(n => {
      if (typeof n === 'number' && typeof numericDragged === 'number') {
        return n === numericDragged ? undefined : n;
      }
      return n;
    });
    setAvailableNumbers(newAvailable);

    // Verificar si todos los números fueron colocados (todos son undefined)
    const allPlaced = newAvailable.every(n => n === undefined);

    if (allPlaced) {
      // Todos los números colocados: guardar resultados
      saveRoundResults(currentHints);
      setIsRoundCompleted(true);

      // Siempre mostrar feedback al completar la ronda (ya sea manual o con pista)
      setFeedbackType('correct');
      setShowFeedbackScreen(true);
    } else {
      // Aún quedan números: solo mostrar feedback si NO es una pista
      if (!isHint) {
        setFeedbackType('correct');
        setShowFeedbackScreen(true);
      }
    }
  };

  /**
   * Resumen funcional:
   * Guarda los resultados de la ronda actual en el backend y acumula métricas.
   *
   * Flujo de ejecución:
   * 1. Calcula el tiempo transcurrido desde el inicio de la ronda
   * 2. Acumula métricas (pistas, errores, tiempo, aciertos)
   * 3. Envía resultado de la ronda al backend mediante API
   *
   * @param currentHints - Valor actual de hints (opcional, usa hintsCount si no se proporciona)
   * @returns Promise<void> que resuelve cuando se guardan los resultados
   *
   * @example
   * await saveRoundResults(2);
   */
  const saveRoundResults = async (currentHints?: number) => {
    const timeSeconds = (Date.now() - roundStartTime) / 1000;
    const finalHintsCount = currentHints !== undefined ? currentHints : hintsCount;
    const numbersInRound = correctOrder.length;

    // Acumular métricas de la partida actual
    setTotalHintsUsed(prev => prev + finalHintsCount);
    setTotalErrorsMade(prev => prev + errorsCount);
    setRoundTimes(prev => [...prev, timeSeconds]);
    setTotalNumbersCorrect(prev => prev + numbersInRound);
    setTotalNumbersRequired(prev => prev + numbersInRound);

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
   * Resumen funcional:
   * Cierra la pantalla de feedback y avanza a la siguiente ronda si corresponde.
   *
   * Flujo de ejecución:
   * 1. Guarda el estado de completitud de la ronda actual
   * 2. Cierra pantalla de feedback
   * 3. Si la ronda está completa y fue correcta, avanza a la siguiente ronda
   *
   * @returns void
   *
   * @example
   * closeFeedbackScreen();
   */
  const closeFeedbackScreen = () => {
    const wasCompleted = isRoundCompleted;
    const wasCorrect = feedbackType === 'correct';

    setShowFeedbackScreen(false);
    setFeedbackType(null);

    // Si fue correcto y la ronda está completa, avanzar a la siguiente ronda
    if (wasCorrect && wasCompleted) {
      advanceToNextRound();
    }
    // Si no está completa, simplemente continúa jugando la ronda actual
  };

  /**
   * Resumen funcional:
   * Avanza a la siguiente ronda o finaliza el juego si es la última ronda.
   *
   * Flujo de ejecución:
   * 1. Si quedan rondas, incrementa el contador de ronda
   * 2. Si era la última ronda, llama a `finishGame()`
   *
   * @returns void
   *
   * @example
   * advanceToNextRound();
   */
  const advanceToNextRound = () => {
    if (currentRound < TOTAL_ROUNDS) {
      setCurrentRound(prev => prev + 1);
    } else {
      finishGame();
    }
  };

  /**
   * Resumen funcional:
   * Proporciona una pista colocando automáticamente el número correcto en el
   * primer slot vacío. No muestra feedback para no recompensar el uso de pistas.
   *
   * Flujo de ejecución:
   * 1. Verifica que no haya feedback activo y que haya números disponibles
   * 2. Incrementa el contador de pistas
   * 3. Encuentra el primer slot vacío y el número correcto
   * 4. Coloca automáticamente el número sin mostrar feedback
   *
   * @returns void
   *
   * @example
   * useHint();
   */
  const useHint = () => {
    // No permitir usar pista durante feedback o si no hay números disponibles
    if (showFeedback) return;

    // Verificación correcta: buscar cualquier número válido (incluyendo 0)
    const hasAvailableNumbers = availableNumbers.some(n => typeof n === 'number');
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

    // Colocar el número correcto automáticamente, pasando isHint=true para evitar feedback
    tryPlaceNumber(correctNumber, firstEmptyIndex, newHintsCount, true);
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
    const totalTime = (Date.now() - gameStartTime) / 1000;

    if (sessionId) {
      try {
        await gamesAPI.finishGameSession(sessionId, totalTime);
      } catch (error) {
        console.error('Error finishing game:', error);
      }
    }

    setGameFinished(true);
  };

  /**
   * Resumen funcional:
   * Redirige al dashboard correspondiente según el rol del usuario.
   *
   * @returns void
   *
   * @example
   * exitToDashboard();
   */
  const exitToDashboard = () => {
    setExiting(true);
    const dashboardRoute = user?.role === "student" ? '/student/dashboard' : '/teacher/dashboard';
    router.push(dashboardRoute, "root", "push");
  };

  /**
   * Resumen funcional:
   * Maneja la salida anticipada del juego (botón home) guardando el progreso actual.
   *
   * Flujo de ejecución:
   * 1. Cierra pantallas de feedback activas
   * 2. Si hay números colocados, guarda la ronda incompleta con omisiones
   * 3. Finaliza la sesión en el backend
   * 4. Redirige al dashboard correspondiente
   *
   * @returns Promise<void>
   *
   * @example
   * await handleEarlyExit();
   */
  const handleEarlyExit = async () => {
    setExiting(true);
    // Primero cerrar cualquier pantalla de feedback
    setShowFeedbackScreen(false);
    setFeedbackType(null);

    if (sessionId) {
      try {
        const hasPlacedNumbers = orderedNumbers.some(num => num !== undefined);

        if (hasPlacedNumbers) {
          const timeSeconds = (Date.now() - roundStartTime) / 1000;

          // Contar cuántos números NO fueron colocados (quedaron sin colocar)
          const omissionsCount = availableNumbers.filter(n => n !== undefined).length;
          const placedCount = orderedNumbers.filter(n => n !== undefined).length;
          const requiredCount = correctOrder.length;

          setTotalNumbersCorrect(prev => prev + placedCount);
          setTotalNumbersRequired(prev => prev + requiredCount);
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

        if (!gameFinished) {
          const totalTimeSeconds = (Date.now() - gameStartTime) / 1000;
          await gamesAPI.finishGameSession(sessionId, totalTimeSeconds);
        }
      } catch (error) {
        console.error('Error saving early exit:', error);
      }
    }

    // Redirect to dashboard
    exitToDashboard();
  };

  /**
   * Resumen funcional:
   * Maneja el inicio del arrastre mediante HTML5 drag and drop.
   *
   * Flujo de ejecución:
   * 1. Configura los datos de transferencia del drag
   * 2. Crea una imagen personalizada para el preview del drag
   * 3. Actualiza el estado con el número que se está arrastrando
   *
   * @param e - Evento de drag de React
   * @param number - Número que se está arrastrando
   * @returns void
   *
   * @example
   * handleDragStart(event, 5);
   */
  const handleDragStart = (e: React.DragEvent, number: number) => {
    if (showFeedback) return;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(number));

    // Deseleccionar cualquier número previamente seleccionado
    setSelectedNumber(null);

    // Crear imagen personalizada para drag
    const dragElement = e.currentTarget as HTMLElement;
    const clone = dragElement.cloneNode(true) as HTMLElement;

    // Asegurar que todas las imágenes dentro del clon no sean draggables
    const cloneImages = clone.querySelectorAll('img');
    cloneImages.forEach(img => {
      img.draggable = false;
      img.setAttribute('draggable', 'false');
      (img as HTMLElement).style.pointerEvents = 'none';
    });

    // Mantener colores actuales del tema usando las mismas clases
    clone.classList.add('number-card-selected', 'drag-preview');
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    const { width, height } = window.getComputedStyle(dragElement);
    clone.style.width = width;
    clone.style.height = height;

    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, 55, 55);

    setTimeout(() => {
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
    }, 0);

    setDraggingNumber(number);
  };

  /**
   * Resumen funcional:
   * Maneja el fin del arrastre HTML5 limpiando el estado.
   *
   * @returns void
   *
   * @example
   * handleDragEnd();
   */
  const handleDragEnd = () => {
    setDraggingNumber(null);
  };

  /**
   * Resumen funcional:
   * Maneja el click en un número para seleccionarlo/deseleccionarlo visualmente.
   *
   * @param number - Número clickeado
   * @returns void
   *
   * @example
   * handleNumberClick(5);
   */
  const handleNumberClick = (number: number) => {
    if (showFeedback) return;
    setSelectedNumber(selectedNumber === number ? null : number);
  };

  /**
   * Resumen funcional:
   * Maneja el inicio del touch en un número para dispositivos móviles/tablets.
   *
   * Flujo de ejecución:
   * 1. Previene el comportamiento por defecto para evitar scroll
   * 2. Guarda el número que se está arrastrando
   * 3. Crea un clon visual del elemento para seguir el toque
   *
   * @param e - Evento touch de React
   * @param number - Número que se está arrastrando
   * @returns void
   *
   * @example
   * handleTouchStart(event, 5);
   */
  const handleTouchStart = (e: React.TouchEvent, number: number) => {
    if (showFeedback) return;

    // Prevenir comportamiento por defecto para evitar scroll
    e.preventDefault();

    const touch = e.touches[0];
    //setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggingNumber(number);
    setSelectedNumber(null); // Deseleccionar al empezar drag

    // Crear elemento visual para el drag
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clone = target.cloneNode(true) as HTMLElement;
    clone.classList.add('number-card-dragging-touch');
    clone.style.position = 'fixed';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.transform = 'none';
    clone.style.left = `${touch.clientX - rect.width / 2}px`;
    clone.style.top = `${touch.clientY - rect.height / 2}px`;
    clone.id = 'touch-drag-clone';

    document.body.appendChild(clone);
    setDraggedElement(clone);
  };

  /**
   * Resumen funcional:
   * Maneja el movimiento del touch actualizando la posición visual del elemento arrastrado.
   *
   * @param e - Evento touch de React
   * @returns void
   *
   * @example
   * handleTouchMove(event);
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    // Permitir arrastrar el número 0 usando comprobación explícita de null
    if (draggingNumber === null || !draggedElement) return;

    e.preventDefault(); // Prevenir scroll mientras arrastra

    const touch = e.touches[0];
    const rect = draggedElement.getBoundingClientRect();
    draggedElement.style.left = `${touch.clientX - rect.width / 2}px`;
    draggedElement.style.top = `${touch.clientY - rect.height / 2}px`;
  };

  /**
   * Resumen funcional:
   * Limpia el estado de arrastre eliminando elementos visuales y reseteando estados.
   * Reutilizable para touchEnd y touchCancel.
   *
   * @returns void
   *
   * @example
   * cleanupTouchDrag();
   */
  const cleanupTouchDrag = () => {
    // Limpiar elemento visual
    if (draggedElement && draggedElement.parentNode) {
      draggedElement.parentNode.removeChild(draggedElement);
    }
    setDraggedElement(null);

    // Limpiar cualquier clon huérfano
    const orphanClone = document.getElementById('touch-drag-clone');
    if (orphanClone && orphanClone.parentNode) {
      orphanClone.parentNode.removeChild(orphanClone);
    }

    // Resetear estados
    setDraggingNumber(null);
  };

  /**
   * Resumen funcional:
   * Maneja el fin del touch detectando dónde se soltó el número y colocándolo si es válido.
   *
   * Flujo de ejecución:
   * 1. Verifica que hay un número siendo arrastrado
   * 2. Limpia elementos visuales del drag
   * 3. Detecta en qué slot se soltó el número
   * 4. Si es un slot válido, intenta colocar el número
   *
   * @param e - Evento touch de React
   * @returns void
   *
   * @example
   * handleTouchEnd(event);
   */
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Prevenir comportamiento por defecto
    e.preventDefault();

    // CRÍTICO: Verificar typeof number para que funcione con 0
    if (typeof draggingNumber !== 'number') {
      cleanupTouchDrag();
      return;
    }

    const touch = e.changedTouches[0];
    const currentDragging = draggingNumber;

    // Limpiar elementos visuales primero
    cleanupTouchDrag();

    // Encontrar el slot donde se soltó el número
    const dropZone = document.getElementById('drop-zone-container');
    if (dropZone && touch) {
      const slots = dropZone.querySelectorAll('.droppable-slot');
      let targetIndex = -1;

      slots.forEach((slot, index) => {
        const rect = slot.getBoundingClientRect();
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          targetIndex = index;
        }
      });

      if (targetIndex !== -1 && typeof currentDragging === 'number') {
        tryPlaceNumber(currentDragging, targetIndex);
      }
    }
  };

  /**
   * Resumen funcional:
   * Maneja la cancelación del touch limpiando el estado cuando el sistema interrumpe el gesto.
   *
   * @param e - Evento touch de React
   * @returns void
   *
   * @example
   * handleTouchCancel(event);
   */
  const handleTouchCancel = (e: React.TouchEvent) => {
    e.preventDefault();
    cleanupTouchDrag();
  };

  /**
   * Opens the video modal for instructions.
   */
  const openVideoModal = () => {
    setShowVideoModal(true);
  };

  /**
   * Closes the video modal and stops video playback.
   */
  const closeVideoModal = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowVideoModal(false);
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
    const dataStr = e.dataTransfer.getData('text/plain');
    const draggedNumber = parseInt(dataStr, 10);

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

  /*
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
  */


  return (
    <IonPage>
      <IonContent className="game2-content" scrollY={false}>
        {gameFinished ? (
          <ResultsScreen
            totalRounds={TOTAL_ROUNDS}
            totalHints={totalHintsUsed}
            totalErrors={totalErrorsMade}
            totalNumbersCorrect={totalNumbersCorrect}
            totalNumbersRequired={totalNumbersRequired}
            onHomeClick={exitToDashboard}
            headerTitle="Ordenar Nº"
            headerPictogram1={imgOrdenar}
            headerPictogramArrow={imgFlecha}
            headerPictogram2={imgJuego}
            elapsedTime={Math.round(roundTimes.reduce((acc, time) => acc + time, 0))}
            audioPreferences={audioPreferences}
          />
        ) : showExitConfirm ? (
          <ExitScreen
            confirmExit={handleEarlyExit}
            cancelExit={() => setShowExitConfirm(false)}
          />
        ) : (
          <>
            {/* Header */}
            <GameHeader
              title="Ordenar Nº"
              pictogram1={imgOrdenar}
              pictogramArrow={imgFlecha}
              pictogram2={imgJuego}
              currentRound={currentRound}
              totalRounds={TOTAL_ROUNDS}
              onBackClick={() => setShowExitConfirm(true)}
            />

            {/* Wrapper principal */}
            <div className="game2-main-wrapper">
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

                    // Verificar explícitamente que num está en el rango válido de pictogramas (0-10)
                    const pictogramImg = usePictograms && num >= 0 && num <= 10 ? PICTOGRAM_IMAGES[num] : null;
                    const isBeingDragged = draggingNumber === num;
                    const isSelected = selectedNumber === num;

                    // Determinar las clases CSS
                    let classes = 'number-card-v2';
                    if (isBeingDragged) {
                      classes += ' number-card-dragging';
                    } else if (isSelected) {
                      classes += ' number-card-selected';
                    }

                    return (
                      <div
                        key={`available-${num}-${index}`}
                        className={classes}
                        draggable={!showFeedback}
                        onDragStart={(e) => handleDragStart(e, num)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => handleTouchStart(e, num)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchCancel}
                        onClick={() => handleNumberClick(num)}
                        style={{ cursor: showFeedback ? 'not-allowed' : 'grab' }}
                        onDragStartCapture={(e) => {
                          // Prevenir drag de elementos hijos en fase de captura
                          if (e.target !== e.currentTarget) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                      >
                        {pictogramImg ? (
                          <img
                            src={pictogramImg}
                            alt={`Pictograma número ${num}`}
                            className="pictogram-image"
                            loading="eager"
                            decoding="sync"
                            draggable={false}
                            onDragStart={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          />
                        ) : (
                          <span className="number-value">{num}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Zona de ordenamiento (abajo) - Una casilla vacía a la vez */}
                <div id="drop-zone-container">
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
              </div>

              {/* Botones de control */}
              <div className="check-button-container">
                {/* Botón de pistas (Tato) */}
                <GameControlButton
                  noBorder
                  onClick={useHint}
                  disabled={availableNumbers.every(n => n === undefined)}
                >
                  <img
                    src={imgTato}
                    alt="Pista"
                    className="game-control-button-image"
                  />
                </GameControlButton>

                {/* Indicador de orden */}
                <div className="order-indicator">
                  <span className="order-icon">
                    {config?.settings.order === 'ascending' ? '↑' : '↓'}
                  </span>
                  <span className="order-text">
                    {config?.settings.order === 'ascending' ? 'Ascendente' : 'Descendente'}
                  </span>
                </div>

                {/* Botón de instrucciones/tutorial */}
                <GameControlButton
                  onClick={openVideoModal}
                >
                  <img
                    src={imgInstrucciones}
                    alt="Video de ayuda"
                    className="game-control-button-image"
                  />
                  <span className="game-control-button-text">
                    INSTRUCCIONES
                  </span>
                </GameControlButton>
              </div>
            </div>

            {/* Video Modal */}
            {showVideoModal && (
              <div className="game2-video-modal-overlay" onClick={closeVideoModal}>
                <div className="game2-video-modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="game2-video-close-button" onClick={closeVideoModal}>
                    ✕
                  </button>
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    className="game2-video-player"
                  >
                    <source src="/assets/videos/video_game2.mp4" type="video/mp4" />
                    Tu navegador no soporta la reproducción de videos.
                  </video>
                </div>
              </div>
            )}

            {/* Feedback Screen */}
            {showFeedbackScreen && feedbackType && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
                <FeedbackScreen
                  isCorrect={feedbackType === 'correct'}
                  currentRound={currentRound}
                  totalRounds={TOTAL_ROUNDS}
                  headerTitle="Ordenar Nº"
                  headerPictogram1={imgOrdenar}
                  headerPictogramArrow={imgFlecha}
                  headerPictogram2={imgJuego}
                  imgTatoFeliz={imgTatoFeliz}
                  imgTatoTriste={imgTatoTriste}
                  imgSiguiente={imgSiguiente}
                  messages={Messages}
                  onNext={closeFeedbackScreen}
                  onHomeClick={handleEarlyExit}
                  audioPreferences={audioPreferences}
                  onRepeat={feedbackType === 'incorrect' ? closeFeedbackScreen : undefined}
                  hideNextOnError={true}
                />
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Game2;
