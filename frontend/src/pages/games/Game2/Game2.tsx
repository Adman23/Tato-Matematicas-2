/**
 * @file Game2.tsx
 * @description Game 2: Sort the Sequence
 *
 * Educational game that presents shuffled numbers that the user must
 * sort by dragging them to their correct positions (ascending or descending).
 *
 * Game flow:
 * 1. Loads user's custom configuration (range, quantity, order)
 * 2. Creates game session in backend for tracking
 * 3. For each round (5 total):
 *    - Generates random numbers according to configuration
 *    - User drags numbers to correct positions
 *    - Validates in real-time and saves result
 * 4. Finishes session and shows results screen
 *
 * Features:
 * - Native HTML5 drag & drop + touch support
 * - Persistent empty slots
 * - Visual pictograms for range 0-10
 * - Hints system (Tato)
 * - Integrated video tutorial
 * - Complete tracking (time, attempts, errors)
 *
 * @returns React component with complete game UI
 */


import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
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

// Import images for header
import imgOrdenar from '/assets/juegosImg/game2/ordenar.png';
import imgJuego from '/assets/juegosImg/juegoX.png';
import imgPista from '/assets/juegosImg/lupa.png';
import imgTatoFeliz from '/assets/Tato/TatoFeliz.png';
import imgTatoTriste from '/assets/Tato/TatoTriste.png';
import imgSiguiente from '/assets/juegosImg/siguiente.png';
import imgInstrucciones from '/assets/juegosImg/instrucciones.png';

// Arrow from assets
const imgFlecha = '/assets/juegosImg/flecha.png';


// Mapping of numbers to images from assets
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
 * Main component for Game 2: Sort the Sequence.
 *
 * Functional summary:
 * Educational sorting game using drag & drop. User must place shuffled numbers
 * in correct order (ascending or descending) by dragging them one by one to
 * available slots.
 *
 * Execution flow:
 * 1. Loads custom configuration (`loadGameConfig`)
 * 2. Creates backend session (`createGameSession`)
 * 3. Generates 5 rounds with random numbers (`generateRound`)
 * 4. Validates each placement in real-time (`tryPlaceNumber`)
 * 5. Saves results for each round (`saveRoundResults`)
 * 6. Finishes session and shows results (`finishGame`)
 *
 * Minimum contract:
 * - Inputs: game configuration (range, quantity, order) and user actions
 * - Outputs: API calls to create session, save rounds, and finish session
 * - Error modes: network error handling and default configuration fallback
 *
 * @returns React component that renders complete game UI
 *
 * @example
 * // Used in app routing:
 * <Route path="/game/game2" component={Game2} />
 */
const Game2: React.FC = () => {

  const location = useLocation();
  const router = useIonRouter();
  const { user, loadingAuth: authLoading } = useAuth();
  const { getAllMessages, loadingUser } = useUserData();

  // Determine current user (can be student or teacher)
  const currentUser = user;

  // Flag to prevent duplicate session creation (React 18 StrictMode)
  const sessionCreatedRef = useRef(false);

  // Main states
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [audioPreferences, setAudioPreferences] = useState<AudioPreferences | undefined>();

  // Game states
  const [currentRound, setCurrentRound] = useState(1);
  const [availableNumbers, setAvailableNumbers] = useState<(number | undefined)[]>([]); // Fixed grid with numbers or undefined
  const [orderedNumbers, setOrderedNumbers] = useState<(number | undefined)[]>([]);
  const [correctOrder, setCorrectOrder] = useState<number[]>([]);
  const [initialNumbers, setInitialNumbers] = useState<number[]>([]); // Initial shuffled numbers for the round

  // UI states
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFeedbackScreen, setShowFeedbackScreen] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
  const [draggingNumber, setDraggingNumber] = useState<number | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [hoverTimer, setHoverTimer] = useState<number | null>(null);
  const [slotHoverTimer, setSlotHoverTimer] = useState<number | null>(null);
  const [mouseMoveHandler, setMouseMoveHandler] = useState<((e: MouseEvent) => void) | null>(null);
  const [mouseUpHandler, setMouseUpHandler] = useState<((e: MouseEvent) => void) | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // States for touch events (mobile/tablet)
  //const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);

  // Video modal state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Result states
  const [gameFinished, setGameFinished] = useState(false);
  const [isRoundCompleted, setIsRoundCompleted] = useState(false); // If round was completed

  // Round counter states
  const [hintsCount, setHintsCount] = useState(0); // Hints used counter
  const [errorsCount, setErrorsCount] = useState(0); // Errors counter (incorrect placements)
  const [totalHintsUsed, setTotalHintsUsed] = useState(0); // Accumulated hints used in game
  const [totalErrorsMade, setTotalErrorsMade] = useState(0); // Accumulated errors in game
  const [roundTimes, setRoundTimes] = useState<number[]>([]); // Times per round
  const [totalNumbersCorrect, setTotalNumbersCorrect] = useState(0); // Total correct hits (numbers placed correctly)
  const [totalNumbersRequired, setTotalNumbersRequired] = useState(0); // Total numbers played
  const [exiting, setExiting] = useState(false); // Avoid recreating session on exit

  // Custom messages states
  const [Messages, setMessages] = useState<StudentMessage[]>([]);


  // Estado de confirmación de salida
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Determinar si usar pictogramas (solo para rango 0-10)
  const usePictograms = config?.number_range === '0-10';
  const accessibilityMode = config?.settings?.accessibility_mode || 'drag_drop';
  // Drag nativo habilitado salvo en drag_follow u hover_select
  const allowNativeDrag = accessibilityMode !== 'drag_follow' && accessibilityMode !== 'hover_select';
  const enableClickPlacement =
    accessibilityMode === 'drag_drop' ||
    accessibilityMode === 'click_nav' ||
    accessibilityMode === 'hover_select';
  const isHoverSelectMode = accessibilityMode === 'hover_select';
  const isDragFollowMode = accessibilityMode === 'drag_follow';

  // Pre-load images to avoid slots appearing empty while downloading
  useEffect(() => {
    const pictogramUrls = Object.values(PICTOGRAM_IMAGES);
    const uiAssets = [
      imgOrdenar,
      imgJuego,
      imgPista,
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

  // Cleanup global listeners / timers
  useEffect(() => {
    return () => {
      if (mouseMoveHandler) document.removeEventListener('mousemove', mouseMoveHandler);
      if (mouseUpHandler) document.removeEventListener('mouseup', mouseUpHandler);
      if (hoverTimer) window.clearTimeout(hoverTimer);
    };
  }, [mouseMoveHandler, mouseUpHandler, hoverTimer]);

  // Al entrar en feedback/exits limpiar seguimientos y clones
  useEffect(() => {
    if (showFeedback || showFeedbackScreen || gameFinished || exiting || showExitConfirm || showVideoModal) {
      cleanupTouchDrag();
    }
  }, [showFeedback, showFeedbackScreen, gameFinished, exiting, showExitConfirm, showVideoModal]);

  // Load configuration on mount (only once)
  // Runs every time location changes to force complete reset
  useEffect(() => {
    // Reset session ref on component mount
    sessionCreatedRef.current = false;

    setExiting(false);
    // Reset ALL states on entering game
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

    // Reset counters
    setHintsCount(0);
    setErrorsCount(0);
    setTotalHintsUsed(0);
    setTotalErrorsMade(0);
    setRoundTimes([]);
    setTotalNumbersCorrect(0);
    setTotalNumbersRequired(0);

    loadGameConfig();
    setGameStartTime(Date.now());

    // Cleanup on unmount: reset ALL states
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

      // Clean drag element if exists
      const dragClone = document.getElementById('touch-drag-clone');
      if (dragClone && dragClone.parentNode) {
        dragClone.parentNode.removeChild(dragClone);
      }
      setDraggedElement(null);
    };
  },
    [location.pathname]); // Runs when route changes

  // Create session when configuration is loaded (only once)
  useEffect(() => {
    if (config && !sessionId && !sessionCreatedRef.current) {
      sessionCreatedRef.current = true;
      createGameSession();
    }

  }, [config]);

  // Generate new round when currentRound changes
  useEffect(() => {
    if (exiting) return;
    if (config && currentRound <= TOTAL_ROUNDS) {
      generateRound();
    }

  }, [config, currentRound, exiting]);

  // Load custom messages when UserContext finishes loading
  useEffect(() => {
    if (loadingUser) return;
    loadPositiveMessages();
  }, [loadingUser]); // Only depends on loadingUser to avoid loops

  /**
   * Loads custom game configuration from backend.
   *
   * Execution flow:
   * 1. Verifies authenticated user exists (student or teacher)
   * 2. Calls API to get config for 'order_sequence' game
   * 3. Validates received configuration is correct, or uses default values
   * 4. Updates state with received configuration (range, quantity, order)
   * 5. Disables loading indicator
   *
   * @returns Promise that resolves when configuration is loaded
   *
   * @example
   * // On component mount, automatically loads:
   * // config = { number_range: '0-10', settings: { quantity: 5, order: 'ascending' } }
   */
  const loadGameConfig = async () => {
    if (exiting) return;
    try {
      if (!currentUser?.id) return;

      const data = await gamesAPI.getGameConfig(currentUser.id, 'order_sequence');

      // Validate configuration has valid values
      const validatedConfig: GameConfig = {
        ...data,
        number_range: data.number_range || '0-10',
        settings: {
          quantity: data.settings?.quantity || 5,
          order: data.settings?.order || 'ascending',
          accessibility_mode: data.settings?.accessibility_mode || 'drag_drop'
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

      // If loading fails, use default configuration
      const defaultConfig: GameConfig = {
        game_id: 0,
        game_key: 'order_sequence',
        user_id: currentUser?.id || '',
        number_range: '0-10',
        settings: {
          quantity: 5,
          order: 'ascending',
          accessibility_mode: 'drag_drop'
        }
      };

      setConfig(defaultConfig);
      setLoading(false);
    }
  };

  /**
   * Creates new game session in backend for progress tracking.
   *
   * Execution flow:
   * 1. Verifies authenticated user exists (student or teacher)
   * 2. Calls API to create session linked to user and game
   * 3. Saves session_id in state to use when saving rounds
   * 4. session_id allows linking all rounds to this game session
   *
   * @returns Promise that resolves when session is created
   *
   * @example
   * // On component mount:
   * // sessionId = 'uuid-session-789' (saved in state)
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
   * Functional summary:
   * Loads custom feedback messages from UserContext.
   *
   * Execution flow:
   * 1. Waits for UserContext to finish loading
   * 2. Gets normalized messages from `getAllMessages()`
   * 3. If no messages, refreshes user data
   * 4. Updates state with custom messages
   *
   * @returns Promise<void> that resolves when messages are loaded
   *
   * @example
   * await loadPositiveMessages();
   */
  const loadPositiveMessages = async () => {
    try {
      if (!currentUser?.id) return;

      // Try to get messages from context (already normalized)
      let data = getAllMessages?.() || [];
      console.log('Loaded messages from context:', data);

      /*
      // If no messages in context, reload user data
      if ((!data || data.length === 0) && refreshUserData) {
        await refreshUserData();
        data = getAllMessages?.() || [];
      }
      */

      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      // Fallback to default messages
      const defaultMessages: StudentMessage[] = [
        { id: "0", type: 'positive', text_message: '¡Muy bien!' },
        { id: "1", type: 'reinforcement', text_message: '¡Inténtalo de nuevo!' }
      ];
      setMessages(defaultMessages);
    }
  };

  /**
   * Functional summary:
   * Generates numbers and configuration for a new game round.
   *
   * Execution flow:
   * 1. Extracts and validates number range from configuration
   * 2. Generates unique random numbers according to configured quantity
   * 3. Sorts numbers according to configuration (ascending/descending)
   * 4. Shuffles numbers to show in top zone
   * 5. Creates empty array for sorting zone
   * 6. Resets round counters and states
   *
   * @returns void - Updates states: currentNumber, availableNumbers, correctOrder, etc.
   *
   * @example
   * generateRound();
   */
  const generateRound = () => {
    if (!config) return;

    const [min, max] = config.number_range.split('-').map(Number);

    // Validate min and max are valid numbers
    if (isNaN(min) || isNaN(max) || min >= max) {
      console.error('Invalid number range:', config.number_range);
      return;
    }

    const quantity = config.settings.quantity || 5;

    // Validate quantity is a valid number
    if (isNaN(quantity) || quantity <= 0) {
      console.error('Invalid quantity:', config.settings.quantity);
      return;
    }

    // Calculate available numbers in range
    const availableInRange = max - min + 1;

    // Validate not requesting more numbers than available in range
    if (quantity > availableInRange) {
      console.error(
        `Cannot generate ${quantity} unique numbers from range ${min}-${max} (only ${availableInRange} available). ` +
        `Please reduce quantity or increase range.`
      );
      return;
    }

    // Generate quantity unique random numbers
    const numbers = new Set<number>();
    while (numbers.size < quantity) {
      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      numbers.add(randomNum);
    }

    const numbersArray = Array.from(numbers);

    // Sort all numbers according to configuration
    const sorted = [...numbersArray].sort((a, b) =>
      config.settings.order === 'ascending' ? a - b : b - a
    );

    // Create correct order array
    setCorrectOrder(sorted);

    // Shuffle numbers to show at top in random order
    const shuffled = [...numbersArray].sort(() => Math.random() - 0.5);
    setAvailableNumbers(shuffled);

    // Save initial shuffled numbers to send to DB
    setInitialNumbers(shuffled);

    // Create initial empty array for sorting zone (bottom)
    const initialOrdered = new Array(quantity).fill(undefined);
    setOrderedNumbers(initialOrdered);

    setShowFeedback(false);
    setFeedbackType(null);
    setRoundStartTime(Date.now());
    setIsRoundCompleted(false);
    setSelectedNumber(null); // Reset selected number

    // Reset round counters
    setHintsCount(0);
    setErrorsCount(0);
  };


  /**
   * Functional summary:
   * Attempts to place a dragged number in the first available empty slot
   * and validates if it's correct in real-time.
   *
   * Execution flow:
   * 1. Verifies target slot is the first empty slot
   * 2. Checks if number is correct for that position
   * 3. If incorrect, shows error feedback and increments counter
   * 4. If correct, places number and removes it from availableNumbers
   * 5. If all numbers are placed, saves round results
   *
   * @param draggedNumber - Number being attempted to place
   * @param targetIndex - Target slot index
   * @param currentHints - Current hints value to avoid async state issues
   * @param isHint - If true, doesn't show feedback (is automatic hint)
   * @returns void
   *
   * @example
   * tryPlaceNumber(5, 0);
   */
  const tryPlaceNumber = (draggedNumber: number, targetIndex: number, currentHints?: number, isHint: boolean = false) => {
    if (showFeedback) return;

    // Ensure draggedNumber is a number (not string)
    const numericDragged = typeof draggedNumber === 'number' ? draggedNumber : Number(draggedNumber);

    // Find first empty slot
    const firstEmptyIndex = orderedNumbers.findIndex(n => n === undefined);

    // Can only place in first empty slot
    if (targetIndex !== firstEmptyIndex) return;

    // Verify if number is correct for this position
    const isCorrect = numericDragged === correctOrder[firstEmptyIndex];

    if (!isCorrect) {
      // Show feedback screen with error
      setFeedbackType('incorrect');
      setShowFeedbackScreen(true);
      setErrorsCount(prev => prev + 1); // Increment error counter
      return;
    }

    // Is correct: place number and remove from availableNumbers
    const newOrdered = [...orderedNumbers];
    newOrdered[firstEmptyIndex] = numericDragged;
    setOrderedNumbers(newOrdered);

    // Replace number with undefined in availableNumbers (maintain fixed position)
    // Use strict type comparison to ensure it works with 0
    const newAvailable = availableNumbers.map(n => {
      if (typeof n === 'number' && typeof numericDragged === 'number') {
        return n === numericDragged ? undefined : n;
      }
      return n;
    });
    setAvailableNumbers(newAvailable);

    // Verify if all numbers were placed (all are undefined)
    const allPlaced = newAvailable.every(n => n === undefined);

    if (allPlaced) {
      // All numbers placed: save results
      saveRoundResults(currentHints);
      setIsRoundCompleted(true);

      // Always show feedback when completing round (whether manual or with hint)
      setFeedbackType('correct');
      setShowFeedbackScreen(true);
    } else {
      // Numbers still remaining: only show feedback if NOT a hint
      if (!isHint) {
        setFeedbackType('correct');
        setShowFeedbackScreen(true);
      }
    }
  };

  /**
   * Functional summary:
   * Saves current round results to backend and accumulates metrics.
   *
   * Execution flow:
   * 1. Calculates elapsed time since round start
   * 2. Accumulates metrics (hints, errors, time, hits)
   * 3. Sends round result to backend via API
   *
   * @param currentHints - Current hints value (optional, uses hintsCount if not provided)
   * @returns Promise<void> that resolves when results are saved
   *
   * @example
   * await saveRoundResults(2);
   */
  const saveRoundResults = async (currentHints?: number) => {
    const timeSeconds = (Date.now() - roundStartTime) / 1000;
    const finalHintsCount = currentHints !== undefined ? currentHints : hintsCount;
    const numbersInRound = correctOrder.length;

    // Accumulate current game metrics
    setTotalHintsUsed(prev => prev + finalHintsCount);
    setTotalErrorsMade(prev => prev + errorsCount);
    setRoundTimes(prev => [...prev, timeSeconds]);
    setTotalNumbersCorrect(prev => prev + numbersInRound);
    setTotalNumbersRequired(prev => prev + numbersInRound);

    if (sessionId) {
      try {
        // Save completed round result
        await gamesAPI.saveRoundResultGame2(sessionId, {
          round: currentRound,
          numbers: initialNumbers, // Shuffled numbers presented at start
          correct_order: correctOrder, // Expected correct order
          is_correct: true, // Round completed correctly
          time_seconds: timeSeconds,
          hints: finalHintsCount,
          total_incorrect: errorsCount,
          omissions: 0 // No omissions because completed all
        });
      } catch (error) {
        console.error('Error saving round:', error);
      }
    }
  };

  /**
   * Functional summary:
   * Closes feedback screen and advances to next round if applicable.
   *
   * Execution flow:
   * 1. Saves current round completion state
   * 2. Closes feedback screen
   * 3. If round is complete and was correct, advances to next round
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

    // If was correct and round is complete, advance to next round
    if (wasCorrect && wasCompleted) {
      advanceToNextRound();
    }
    // If not complete, simply continues playing current round
  };

  /**
   * Functional summary:
   * Advances to next round or finishes game if last round.
   *
   * Execution flow:
   * 1. If rounds remaining, increments round counter
   * 2. If was last round, calls `finishGame()`
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
   * Functional summary:
   * Provides hint by automatically placing correct number in first empty slot.
   * Doesn't show feedback to avoid rewarding hint usage.
   *
   * Execution flow:
   * 1. Verifies no active feedback and available numbers exist
   * 2. Increments hints counter
   * 3. Finds first empty slot and correct number
   * 4. Automatically places number without showing feedback
   *
   * @returns void
   *
   * @example
   * useHint();
   */
  const useHint = () => {
    resetHoverState(); // Evita clones/hover activos antes de colocar la pista
    // Don't allow hints during feedback or if no available numbers
    if (showFeedback) return;

    // Correct verification: search for any valid number (including 0)
    const hasAvailableNumbers = availableNumbers.some(n => typeof n === 'number');
    if (!hasAvailableNumbers) return;

    // Calculate new hints value
    const newHintsCount = hintsCount + 1;

    // Increment hints counter
    setHintsCount(newHintsCount);

    // Find first empty slot
    const firstEmptyIndex = orderedNumbers.findIndex(n => n === undefined);
    if (firstEmptyIndex === -1) return;

    // Get correct number for that position
    const correctNumber = correctOrder[firstEmptyIndex];

    // Place correct number automatically, passing isHint=true to avoid feedback
    tryPlaceNumber(correctNumber, firstEmptyIndex, newHintsCount, true);
  };

  /**
   * Finishes game session and records total time in backend.
   *
   * Execution flow:
   * 1. Calculates total time since game started
   * 2. Sends time to backend to close session
   * 3. Marks game as finished in state
   * 4. useEffect redirects to dashboard after 2 seconds
   *
   * @returns Promise that resolves when session is finished
   *
   * @example
   * // When completing round 5:
   * // totalTimeSeconds = 150.2 (2 minutes and a half)
   * // → Saves in DB and marks gameFinished = true
   * // → Shows "Game completed!" and redirects
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
   * Functional summary:
   * Redirects to corresponding dashboard based on user role.
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
   * Functional summary:
   * Handles early game exit (home button) saving current progress.
   *
   * Execution flow:
   * 1. Closes any active feedback screens
   * 2. If numbers were placed, saves incomplete round with omissions
   * 3. Finishes session in backend
   * 4. Redirects to corresponding dashboard
   *
   * @returns Promise<void>
   *
   * @example
   * await handleEarlyExit();
   */
  const handleEarlyExit = async () => {
    setExiting(true);
    cleanupTouchDrag(); // asegúrate de limpiar clones/listeners antes de salir
    // First close any feedback screen
    setShowFeedbackScreen(false);
    setFeedbackType(null);

    if (sessionId) {
      try {
        const hasPlacedNumbers = orderedNumbers.some(num => num !== undefined);

        if (hasPlacedNumbers) {
          const timeSeconds = (Date.now() - roundStartTime) / 1000;

          // Count how many numbers were NOT placed (left unplaced)
          const omissionsCount = availableNumbers.filter(n => n !== undefined).length;
          const placedCount = orderedNumbers.filter(n => n !== undefined).length;
          const requiredCount = correctOrder.length;

          setTotalNumbersCorrect(prev => prev + placedCount);
          setTotalNumbersRequired(prev => prev + requiredCount);
          await gamesAPI.saveRoundResultGame2(sessionId, {
            round: currentRound,
            numbers: initialNumbers, // Shuffled numbers presented
            correct_order: correctOrder, // Expected correct order
            is_correct: false, // Didn't complete round
            time_seconds: timeSeconds,
            hints: hintsCount,
            total_incorrect: errorsCount,
            omissions: omissionsCount // Numbers left unplaced
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
   * Functional summary:
   * Handles drag start via HTML5 drag and drop.
   *
   * Execution flow:
   * 1. Configures drag transfer data
   * 2. Creates custom image for drag preview
   * 3. Updates state with number being dragged
   *
   * @param e - React drag event
   * @param number - Number being dragged
   * @returns void
   *
   * @example
   * handleDragStart(event, 5);
   */
  const handleDragStart = (e: React.DragEvent, number: number) => {
    if (showFeedback) return;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(number));

    // Deselect any previously selected number
    setSelectedNumber(null);

    // Create custom image for drag
    const dragElement = e.currentTarget as HTMLElement;
    const clone = dragElement.cloneNode(true) as HTMLElement;

    // Ensure all images inside clone are not draggable
    const cloneImages = clone.querySelectorAll('img');
    cloneImages.forEach(img => {
      img.draggable = false;
      img.setAttribute('draggable', 'false');
      (img as HTMLElement).style.pointerEvents = 'none';
    });

    // Maintain current theme colors using same classes
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
   * Functional summary:
   * Handles HTML5 drag end by cleaning state.
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
   * Functional summary:
   * Handles click on number to select/deselect it visually.
   *
   * @param number - Clicked number
   * @returns void
   *
   * @example
   * handleNumberClick(5);
   */
  const handleNumberClick = (number: number) => {
    if (showFeedback) return;
    setSelectedNumber(selectedNumber === number ? null : number);
    clearHoverSelection();
  };

  function clearHoverSelection() {
    if (hoverTimer) {
      window.clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    if (slotHoverTimer) {
      window.clearTimeout(slotHoverTimer);
      setSlotHoverTimer(null);
    }
  }

  const handleNumberHover = (number: number) => {
    if (!isHoverSelectMode || showFeedback) return;
    clearHoverSelection();
    const timer = window.setTimeout(() => {
      setSelectedNumber(number);
    }, 800); // delay ajustado para interacción rápida por hover
    setHoverTimer(timer);
  };

  const runHoverAction = (action: () => void) => {
    if (isHoverSelectMode) {
      resetHoverState();
      window.setTimeout(action, 800); // coherente con retardo hover
    }
  };

  // Ejecuta acción con retardo hover (800ms) o click inmediato según modo
  const hoverOrClick = (action: () => void) => {
    if (isHoverSelectMode) {
      runHoverAction(action);
    } else {
      action();
    }
  };

  // Limpia estados de hover/drag y selección actual (para botones externos)
  const resetHoverState = () => {
    clearHoverSelection();
    setSelectedNumber(null);
    cleanupTouchDrag();
  };

  /**
   * Functional summary:
   * Handles touch start on number for mobile/tablet devices.
   *
   * Execution flow:
   * 1. Prevents default behavior to avoid scroll
   * 2. Saves number being dragged
   * 3. Creates visual clone of element to follow touch
   *
   * @param e - React touch event
   * @param number - Number being dragged
   * @returns void
   *
   * @example
   * handleTouchStart(event, 5);
   */
  const handleTouchStart = (e: React.TouchEvent, number: number) => {
    if (showFeedback) return;

    if (!allowNativeDrag && !isDragFollowMode) {
      // En modos de click/hover tratamos el toque como un click de selección
      handleNumberClick(number);
      return;
    }

    // Prevent default behavior to avoid scroll
    e.preventDefault();

    const touch = e.touches[0];
    setDraggingNumber(number);
    setSelectedNumber(null); // Deselect when starting drag

    // Create visual element for drag
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
   * Functional summary:
   * Handles touch move by updating visual position of dragged element.
   *
   * @param e - React touch event
   * @returns void
   *
   * @example
   * handleTouchMove(event);
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!allowNativeDrag && !isDragFollowMode) return;
    // Allow dragging number 0 using explicit null check
    if (draggingNumber === null || !draggedElement) return;

    e.preventDefault(); // Prevent scroll while dragging

    const touch = e.touches[0];
    const rect = draggedElement.getBoundingClientRect();
    draggedElement.style.left = `${touch.clientX - rect.width / 2}px`;
    draggedElement.style.top = `${touch.clientY - rect.height / 2}px`;
  };

  /**
   * Functional summary:
   * Cleans drag state by removing visual elements and resetting states.
   * Reusable for touchEnd and touchCancel.
   *
   * @returns void
   *
   * @example
   * cleanupTouchDrag();
   */
  const cleanupTouchDrag = () => {
    // Clean visual element
    if (draggedElement && draggedElement.parentNode) {
      draggedElement.parentNode.removeChild(draggedElement);
    }
    setDraggedElement(null);

    // Clean any orphan clone
    const orphanClones = ['touch-drag-clone', 'mouse-drag-clone'];
    orphanClones.forEach((id) => {
      const orphan = document.getElementById(id);
      if (orphan && orphan.parentNode) {
        orphan.parentNode.removeChild(orphan);
      }
    });
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
      setMouseMoveHandler(null);
    }
    if (mouseUpHandler) {
      document.removeEventListener('mouseup', mouseUpHandler);
      setMouseUpHandler(null);
    }
    // Reset states
    setDraggingNumber(null);
    setIsFollowing(false);
  };

  /**
   * Functional summary:
   * Handles touch end by detecting where number was released and placing if valid.
   *
   * Execution flow:
   * 1. Verifies a number is being dragged
   * 2. Cleans visual drag elements
   * 3. Detects in which slot number was released
   * 4. If valid slot, attempts to place number
   *
   * @param e - React touch event
   * @returns void
   *
   * @example
   * handleTouchEnd(event);
   */
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!allowNativeDrag && !isDragFollowMode) return;
    // Prevent default behavior
    e.preventDefault();

    // CRITICAL: Verify typeof number to work with 0
    if (typeof draggingNumber !== 'number') {
      cleanupTouchDrag();
      return;
    }

    const touch = e.changedTouches[0];
    const currentDragging = draggingNumber;

    // Clean visual elements first
    cleanupTouchDrag();

    // Find slot where number was released
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

  const handleNumberKeyDown = (e: React.KeyboardEvent, number: number) => {
    if (showFeedback) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNumberClick(number);
    }
  };

  /**
   * Functional summary:
   * Handles touch cancel by cleaning state when system interrupts gesture.
   *
   * @param e - React touch event
   * @returns void
   *
   * @example
   * handleTouchCancel(event);
   */
  const handleTouchCancel = (e: React.TouchEvent) => {
    if (!allowNativeDrag && !isDragFollowMode) return;
    e.preventDefault();
    cleanupTouchDrag();
  };

  /**
   * Opens video modal for instructions.
   */
  const openVideoModal = () => {
    resetHoverState(); // Limpiar clones/hover al abrir instrucciones
    setShowVideoModal(true);
  };

  /**
   * Closes video modal and stops video playback.
   */
  const closeVideoModal = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowVideoModal(false);
  };

  /**
   * Handles drag over on a slot.
   */
  const handleDragOver = (e: React.DragEvent) => {
    if (!allowNativeDrag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * Handles drop on a slot.
   */
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!allowNativeDrag) return;
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('text/plain');
    const draggedNumber = parseInt(dataStr, 10);

    if (!isNaN(draggedNumber)) {
      tryPlaceNumber(draggedNumber, targetIndex);
    }
    setDraggingNumber(null);
  };

  /**
   * Place selected number when using click/keyboard modes.
   */
  const handleSlotClick = (targetIndex: number) => {
    if (!enableClickPlacement) return;
    if (showFeedback || selectedNumber === null) return;
    tryPlaceNumber(selectedNumber, targetIndex);
    setSelectedNumber(null);
    resetHoverState();
  };

  const handleSlotKeyDown = (e: React.KeyboardEvent, targetIndex: number) => {
    if (!enableClickPlacement) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSlotClick(targetIndex);
    }
  };

  // Hover placement for hover_select mode
  const handleSlotHover = (targetIndex: number) => {
    if (showFeedback) return;
    // Hover-select: coloca tras selección por hover
    if (isHoverSelectMode && selectedNumber !== null) {
      if (slotHoverTimer) {
        window.clearTimeout(slotHoverTimer);
        setSlotHoverTimer(null);
      }
      const timer = window.setTimeout(() => {
        tryPlaceNumber(selectedNumber, targetIndex);
        setSelectedNumber(null);
        resetHoverState();
      }, 800);
      setSlotHoverTimer(timer);
      return;
    }
    // Drag-follow: coloca el número que sigue al cursor
    if (isDragFollowMode && draggingNumber !== null) {
      tryPlaceNumber(draggingNumber, targetIndex);
      setSelectedNumber(null);
      resetHoverState();
    }
  };

  /**
   * Mouse-follow drag for accessibility mode "drag_follow".
   */
  const startMouseFollow = (e: React.MouseEvent, number: number) => {
    if (!isDragFollowMode || showFeedback) return;
    e.preventDefault();

    // Reiniciar cualquier seguimiento previo
    if (isFollowing) {
      cleanupTouchDrag();
    }

    setDraggingNumber(number);
    setSelectedNumber(number);
    setIsFollowing(true);

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
    clone.style.left = `${e.clientX - rect.width / 2}px`;
    clone.style.top = `${e.clientY - rect.height / 2}px`;
    clone.id = 'mouse-drag-clone';
    document.body.appendChild(clone);
    setDraggedElement(clone);

    const moveHandler = (ev: MouseEvent) => {
      const rectClone = clone.getBoundingClientRect();
      clone.style.left = `${ev.clientX - rectClone.width / 2}px`;
      clone.style.top = `${ev.clientY - rectClone.height / 2}px`;
    };

    document.addEventListener('mousemove', moveHandler);
    setMouseMoveHandler(() => moveHandler);
  };



  // Authentication loading screen
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

  // Redirect if no authenticated user (student or teacher)
  if (!user) {
    return <Redirect to="/student/login" />;
  }

  // Game loading screen
  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: '50%' }}>
            <IonSpinner name="crescent" />
            <IonText>
              <p>Loading game...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  /*
  // If game finished, show message
  if (gameFinished) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: '50%' }}>
            <IonText color="success">
              <h1>Game completed!</h1>
              <h1>FEEDBACK MESSAGE COULD GO HERE! ??</h1>
              <p>Returning to home...</p>
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
            onHomeClick={() => hoverOrClick(exitToDashboard)}
            headerTitle="Ordenar Nº"
            headerPictogram1={imgOrdenar}
            headerPictogramArrow={imgFlecha}
            headerPictogram2={imgJuego}
            elapsedTime={Math.round(roundTimes.reduce((acc, time) => acc + time, 0))}
            audioPreferences={audioPreferences}
            enableHoverMode={isHoverSelectMode}
          />
        ) : showExitConfirm ? (
          <ExitScreen
            confirmExit={() => hoverOrClick(handleEarlyExit)}
            cancelExit={() => hoverOrClick(() => setShowExitConfirm(false))}
            enableHoverMode={isHoverSelectMode}
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
                onBackClick={() => {
                  resetHoverState();
                  setShowExitConfirm(true);
                }}
                onBackHover={() => runHoverAction(() => setShowExitConfirm(true))}
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
                        draggable={allowNativeDrag && !showFeedback}
                        onDragStart={allowNativeDrag ? (e) => handleDragStart(e, num) : undefined}
                        onDragEnd={allowNativeDrag ? handleDragEnd : undefined}
                        onTouchStart={(e) => handleTouchStart(e, num)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchCancel}
                        onMouseDown={(e) => {
                          if (isDragFollowMode) startMouseFollow(e, num);
                        }}
                        onMouseUp={(e) => {
                          if (isDragFollowMode) {
                            // Ya se está siguiendo al cursor, evitar que mouseup haga drop
                            e.preventDefault();
                          }
                        }}
                        onMouseEnter={() => handleNumberHover(num)}
                        onMouseLeave={clearHoverSelection}
                        onClick={() => handleNumberClick(num)}
                        onKeyDown={(e) => handleNumberKeyDown(e, num)}
                        tabIndex={0}
                        style={{ cursor: showFeedback ? 'not-allowed' : enableClickPlacement ? 'pointer' : 'grab' }}
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
                    onSlotClick={handleSlotClick}
                    onSlotKeyDown={handleSlotKeyDown}
                    enableClickPlacement={enableClickPlacement}
                    onSlotHover={handleSlotHover}
                    enableHoverPlacement={isHoverSelectMode || isDragFollowMode}
                  />
                </div>
              </div>

                {/* Botones de control */}
                <div className="check-button-container" onMouseEnter={resetHoverState}>
                  {/* Botón de pistas (Tato) */}
                  <GameControlButton
                    onMouseEnter={() => runHoverAction(useHint)}
                    onFocus={resetHoverState}
                    onClick={() => hoverOrClick(useHint)}
                    disabled={availableNumbers.every(n => n === undefined)}
                  >
                    <img
                      src={imgPista}
                      alt="Pista"
                      className="game-control-button-image"
                    />
                    <span className="game-control-button-text">
                      PISTA
                    </span>
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
                    onMouseEnter={() => runHoverAction(openVideoModal)}
                    onFocus={resetHoverState}
                    onClick={() => hoverOrClick(openVideoModal)}
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
                    aria-label="Video de instrucciones del Juego 2: Ordenar números"
                  >
                    <source src="/assets/videos/video_game2.mp4" type="video/mp4" />
                    Tu navegador no soporta la reproducción de videos.
                  </video>
                </div>
              </div>
            )}

            {/* Feedback Screen */}
            {showFeedbackScreen && feedbackType && (
              <div
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}
                onMouseEnter={() => runHoverAction(closeFeedbackScreen)}
              >
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
                  onNext={() => hoverOrClick(closeFeedbackScreen)}
                  onHomeClick={() => hoverOrClick(handleEarlyExit)}
                  audioPreferences={audioPreferences}
                  onRepeat={feedbackType === 'incorrect' ? () => hoverOrClick(closeFeedbackScreen) : undefined}
                  hideNextOnError={true}
                  enableHoverMode={isHoverSelectMode}
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
