/**
 * Game 1: Associate Sound with Number.
 *
 * The student listens to a sound representing a number and must
 * select the correct number from several options.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    IonContent,
    IonPage,
    useIonRouter
} from '@ionic/react';
import { Redirect } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext';
import { useUserData } from '../../../contexts/UserContext';
import { gamesAPI } from '../../../lib/api';
import type { GameConfig, StudentMessage } from '../../../lib/api';

import GameHeader from '../components/GameHeader';
import FeedbackScreen from '../components/FeedbackScreen';
import ExitScreen from '../components/ExitScreen';
import './Game1.css';


// Importar imágenes
import imgAceptar from '/assets/pictograms/correctoS.png';
import imgSonido from '/assets/pictograms/escucha.png';
import imgJuego from '/assets/juegosImg/juegoX.png';
import imgInstrucciones from '/assets/juegosImg/instrucciones.png';
import imgPista from '/assets/juegosImg/lupa.png';
import imgFlecha from '/assets/juegosImg/flecha.png';

import BubblesZone from './BubblesZone';
import audioManager from '../../../lib/AudioManager';
import ResultsScreen from '../components/ResultsScreen';
import { GameControlButton } from '../../global_components/GameControlButton';
import LoadingSpinner from '../../global_components/LoadingSpinner';
import { getAudioPreferences, type AudioPreferences } from '../../../lib/api';

const TOTAL_ROUNDS = 5;


/**
 * Functional Summary.
 *
 * Educative game that associates a sound with its corresponding number. The
 * student listens to the pronunciation of a number and must select the correct
 * option among several visual bubbles.
 *
 * Execution flow.
 * 1. Loads the user's custom configuration (`loadGameConfig`).
 * 2. Creates a game session in the backend (`createGameSession`).
 * 3. For each round:
 *    - Generates the options and the target number (`generateRound`).
 *    - The student can listen to the number (`speakNumber`), use a hint (`useHint`), and select an option.
 *    - When checking the answer, feedback is shown and the result is saved (`checkAnswer`).
 * 4. When all rounds are completed, the session is finished (`finishGame`) and redirected.
 *
 * Minimum contract:
 * - Inputs: game configuration from the backend and user actions (clicks).
 * - Outputs: API calls to create session, save rounds, and finish session.
 * - Error modes: network error handling and fallback to default configuration.
 *
 * @returns React component that renders the complete game UI.
 *
 * @example
 * // Routing
 * <Route path="/game/game1" component={Game1} />
 */
const Game1: React.FC = () => {

    const { user, loadingAuth: authLoading } = useAuth();
    const router = useIonRouter();

    const currentUser = user;
    const { getAllMessages, loadingUser } = useUserData();

    // Flag to prevent duplicate session creation (React 18 StrictMode)
    const sessionCreatedRef = useRef(false);

    // Main states
    const [loadingGame, setLoadingGame] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [config, setConfig] = useState<GameConfig | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [audioPreferences, setAudioPreferences] = useState<AudioPreferences | undefined>();

    // Game states
    const [currentRound, setCurrentRound] = useState(1);
    const [availableNumbers, setAvailableNumbers] = useState<(number | undefined)[]>([]);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
    const [usedNumbers, setUsedNumbers] = useState<number[]>([]);

    // Hints
    const [hintsUsed, setHintsUsed] = useState<number[]>([]);
    const [hintsCount, setHintsCount] = useState(0);

    // Attempts
    const [attemptsCount, setAttemptsCount] = useState(0);

    //Messages
    const [Messages, setMessages] = useState<StudentMessage[]>([]);

    // UI states
    const [showFeedbackScreen, setShowFeedbackScreen] = useState(false);
    const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
    const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
    const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
    const [listeningAudio, setListeningAudio] = useState(false);

    // Video modal state
    const [showVideoModal, setShowVideoModal] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Result states
    const [gameFinished, setGameFinished] = useState(false);

    // Exit confirmation state
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    //Contadores de resultados
    const [totalNumbersCorrect, setTotalNumbersCorrect] = useState(0);
    const [totalHintsUsed, setTotalHintsUsed] = useState(0);
    const [totalErrorsMade, setTotalErrorsMade] = useState(0);
    const [roundTimes, setRoundTimes] = useState<number[]>([]); // Tiempos por ronda

    // Accessibility announcement state
    const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

    /**
     * Function to make accessible announcements using aria-live.
     * Waits for the current announcement to finish before announcing the change.
     * 
     * @param message - Message to announce
     */
    const announce = (message: string) => {
        // Clear first to force re-announcement if it's the same message
        setLiveAnnouncement('');
        // Small delay to ensure screen reader detects the change for accessibility announcements (aria-live)
        setTimeout(() => {
            setLiveAnnouncement(message);
        }, 100);
    };


    // Determine if pictograms should be used (only for range 0-10)
    const usePictograms = config?.number_range === '0-10';

    // Determine if female or male voice should be used
    const useWomanVoice = config?.settings?.voice === 'woman';

    // Load configuration on mount (only once)
    useEffect(() => {
        sessionCreatedRef.current = false;

        setGameFinished(false);
        setCurrentRound(1);
        setSessionId(null);
        setSelectedNumber(null);
        setUsedNumbers([]);

        loadGameConfig();
        setGameStartTime(Date.now());

        return () => {
            sessionCreatedRef.current = false;
        };
    },
        []);

    // Load messages once the UserContext has finished loading user data
    useEffect(() => {
        // If the context is still loading, wait. When it's ready, fetch messages.
        if (loadingUser) return;

        // If userData is present, attempt to load messages from context
        loadPositiveMessages();
    }, [loadingUser]); // Solo depende de loadingUser para evitar loops

    // Create session when configuration is loaded (only once)
    useEffect(() => {
        if (config && !sessionId && !sessionCreatedRef.current) {
            sessionCreatedRef.current = true;
            createGameSession();
        }

    }, [config]);

    // Generate new round when currentRound changes
    useEffect(() => {
        if (config && sessionId && currentRound <= TOTAL_ROUNDS) {
            generateRound();
        }

    }, [config, currentRound, sessionId]);

    /**
     * Functional Summary.
     *
     * Loads the user's custom game configuration from the backend and
     * saves it in local state. If the request fails, applies a safe default configuration.
     *
     * Execution flow.
     * 1. Checks that an authenticated user exists.
     * 2. Calls the `gamesAPI.getGameConfig` API to get the configuration.
     * 3. Validates and normalizes the received values.
     * 4. Updates `config` and disables the `loading` indicator.
     *
     * @returns Promise<void> that resolves when the configuration has been loaded.
     *
     * @example
     * await loadGameConfig();
     */
    const loadGameConfig = async () => {
        try {
            if (!currentUser?.id) return;

            const data = await gamesAPI.getGameConfig(currentUser.id, 'touch_number');

            // Validate that the configuration has valid values
            const validatedConfig: GameConfig = {
                ...data,
                number_range: data.number_range || '0-10',
                settings: {
                    options_count: data.settings?.options_count || 9,
                    voice: data.settings?.voice || 'woman'
                }
            };

            setConfig(validatedConfig);

            // Load audio preferences
            try {
                const audioPrefs = await getAudioPreferences(currentUser.id);
                setAudioPreferences(audioPrefs);
            } catch (err) {
                console.error('Error loading audio preferences:', err);
                // Use defaults if error
            }

            setLoadingGame(false);
        } catch (error) {
            console.error('Error loading game config:', error);

            // If loading fails, use default configuration
            const defaultConfig: GameConfig = {
                game_id: 0,
                game_key: 'touch_number',
                user_id: currentUser?.id || '',
                number_range: '0-10',
                settings: {
                    options_count: 9,
                    voice: 'woman'
                }
            };

            setConfig(defaultConfig);
            setLoadingGame(false);
        }
    };

    const loadPositiveMessages = async () => {
        try {
            if (!currentUser?.id) return;
            // Try to get messages from the UserContext (already normalized)
            let data = getAllMessages?.() || [];
            console.log('Loaded messages from context:', data);

            /* THIS GENERATES A LOOP
            // If there are no messages in the context yet, try refreshing user data once
            if ((!data || data.length === 0) && refreshUserData) {
                await refreshUserData();
                data = getAllMessages?.() || [];
            }
            */

            setMessages(data);
            setLoadingMessages(false);

        } catch (error) {
            console.error('Error loading positive messages:', error);
            const defaultMessages: StudentMessage[] = [
                { id: "0", type: 'positive', text_message: '¡Muy bien!' },
                { id: "1", type: 'reinforcement', text_message: '¡Inténtalo de nuevo!' }
            ];
            setMessages(defaultMessages);
            setLoadingMessages(false);
        }
    };

    /**
     * Functional Summary.
     *
     * Creates a game session in the backend to link all rounds and results
     * to a single session.
     *
     * Execution flow.
     * 1. Checks that an authenticated user exists.
     * 2. Calls `gamesAPI.createGameSession` and saves the `session_id` in state.
     *
     * @returns Promise<void> that resolves when the session has been created.
     *
     * @example
     * await createGameSession();
     */
    const createGameSession = async () => {
        try {
            if (!currentUser?.id) return;

            const data = await gamesAPI.createGameSession(currentUser.id, 'touch_number');
            setSessionId(data.session_id);
        } catch (error) {
            console.error('Error creating game session:', error);
        }
    };

    /**
     * Functional Summary.
     *
     * Generates the numeric options for a new round and selects the
     * number that will be played (currentNumber).
     *
     * Execution flow.
     * 1. Validates the configured number range.
     * 2. Generates `totalNumbers` unique numbers within the range.
     * 3. Selects a `roundNumber` not previously used and ensures it is within the options.
     * 4. Shuffles the options and resets the round counters.
     *
     * @returns void - Updates states: currentNumber, availableNumbers, usedNumbers, etc.
     *
     * @example
     * generateRound();
     */
    const generateRound = () => {
        if (!config) return;

        const [min, max] = config.number_range.split('-').map(Number);

        // Validate that min and max are valid numbers
        if (isNaN(min) || isNaN(max) || min >= max) {
            console.error('Invalid number range:', config.number_range);
            return;
        }

        const totalNumbers = config.settings.options_count || 5; // available options

        // Validate that totalNumbers is a valid number
        if (isNaN(totalNumbers) || totalNumbers <= 0) {
            console.error('Invalid totalNumbers:', config.settings.options_count);
            return;
        }

        // Calculate available numbers in the range
        const availableInRange = max - min + 1;

        // Validate that totalNumbers does not exceed available numbers in the range
        if (totalNumbers > availableInRange) {
            console.error(
                `Cannot generate ${totalNumbers} unique numbers from range ${min}-${max} (only ${availableInRange} available). ` +
                `Please reduce totalNumbers or increase range.`
            );
            return;
        }

        // Generate totalNumbers unique random numbers
        const numbers = new Set<number>();
        while (numbers.size < totalNumbers) {
            const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
            numbers.add(randomNum);
        }

        const numbersArray = Array.from(numbers);

        // Generate number to be heard (currentNumber)
        let roundNumber: number;
        do {
            roundNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (usedNumbers.includes(roundNumber) && usedNumbers.length < numbersArray.length);

        // Ensure the correct number is in the options
        if (!numbers.has(roundNumber)) {
            // Replace a random number with the correct one
            const replaceIndex = Math.floor(Math.random() * numbersArray.length);
            numbersArray[replaceIndex] = roundNumber;
        }

        // Shuffle the available numbers randomly (so they are not in order)
        const poolNumbers = numbersArray.sort(() => Math.random() - 0.5);

        setCurrentNumber(roundNumber);
        setUsedNumbers(prev => [...prev, roundNumber]);
        setAvailableNumbers(poolNumbers);
        console.log('Generated round', currentRound, 'with numbers:', poolNumbers);
        setRoundStartTime(Date.now());
        setAttemptsCount(0);
        setHintsUsed([]);
        setHintsCount(0);
        setSelectedNumber(null);
        setListeningAudio(false);

        // Announce new round for screen readers
        announce(`Ronda ${currentRound} de ${TOTAL_ROUNDS}. Escucha el número y selecciona la opción correcta.`);
    };


    /**
     * Functional Summary.
     *
     * Marks an incorrect option as a hint for the student.
     *
     * Execution flow.
     * - If `showFeedbackScreen` is active or there is no current number, does nothing.
     * - Searches for an available incorrect option that has not been marked and adds it to `hintsUsed`.
     *
     * @returns void
     * @example
     * useHint();
     */
    const useHint = () => {
        // No hints when feedback screen is shown
        if (showFeedbackScreen) return;

        // Do not allow hints if there is no current number
        if (currentNumber === null) return;

        // Search for an available number that is not correct
        // and has not already been used as a hint
        const availableIncorrectNumbers = availableNumbers.filter(
            n => n !== undefined && n !== currentNumber && !hintsUsed.includes(n)
        );

        if (availableIncorrectNumbers.length === 0) {
            // No more numbers available to use as hints
            console.log('No hay más opciones incorrectas disponibles para usar como pista');
            return;
        }

        // Select a random incorrect number to disable
        const randomIndex = Math.floor(Math.random() * availableIncorrectNumbers.length);
        const hintNumber = availableIncorrectNumbers[randomIndex] as number;

        // Mark the number as used in hints
        setHintsUsed(prev => [...prev, hintNumber]);
        setHintsCount(prev => prev + 1);
        setTotalHintsUsed(prev => prev + 1);
        console.log(`Pista usada: se ha deshabilitado el número ${hintNumber}`);

        // Anunciar pista para lectores de pantalla
        const remainingHints = availableIncorrectNumbers.length;
        announce(`Pista usada. Se ha eliminado una opción incorrecta. ${remainingHints > 0 ? `Quedan ${remainingHints} pistas disponibles.` : 'No quedan más pistas.'}`);
    };

    /**
     * Functional Summary.
     *
     * Validates the answer selected by the user, shows the feedback screen,
     * and saves the result to the backend if applicable.
     *
     * Execution flow.
     * - Calculates the time elapsed since the start of the round.
     * - Determines if the answer is correct and shows `FeedbackScreen`.
     * - If the answer is correct, saves the result to the API (`saveRoundResultGame1`).
     *
     * @returns Promise<void> that resolves when validation and saving (if applicable) are complete.
     *
     * @example
     * await checkAnswer();
     */
    const checkAnswer = async () => {
        // Verify that a number is selected
        if (selectedNumber === null) {
            return;
        }

        // Compare the selected number with the correct one
        const correct = selectedNumber === currentNumber;

        // Store if answer is correct and show feedback screen
        setIsCorrectAnswer(correct);
        setShowFeedbackScreen(true);

        // Anunciar resultado para lectores de pantalla
        if (correct) {
            announce(`¡Correcto! Has seleccionado el número ${selectedNumber}.`);
        } else {
            announce(`Incorrecto. Has seleccionado el número ${selectedNumber}.`);
        }

        // Save in the backend
        if (sessionId && correct) {
            const timeSeconds = (Date.now() - roundStartTime) / 1000;
            setRoundTimes(prev => [...prev, timeSeconds]);
            setTotalNumbersCorrect(prev => prev + 1);
            try {
                await gamesAPI.saveRoundResultGame1(sessionId, {
                    round: currentRound,
                    numbers: availableNumbers.filter((n): n is number => n !== undefined),
                    selected_number: selectedNumber,
                    correct_number: currentNumber,
                    is_correct: correct,
                    time_seconds: timeSeconds,
                    is_final_attempt: true,
                    attempts: attemptsCount,
                    hints: hintsCount
                });
            } catch (error) {
                console.error('Error saving round:', error);
            }
        }
    };

    /**
     * Repeats the current exercise.
     *
     * Effects:
     * - Increments the attempts counter.
     * - Hides the feedback screens and resets selection and hints.
     *
     * @returns void
     * @example
     * repeatExercise();
     */
    const repeatExercise = () => {
        setAttemptsCount(prev => prev + 1);
        setShowFeedbackScreen(false);
        setHintsUsed([]);
        setRoundStartTime(Date.now());
        setSelectedNumber(null);

        // Anunciar repetición para lectores de pantalla
        announce(`Intentando de nuevo. Ronda ${currentRound} de ${TOTAL_ROUNDS}.`);
    }

    /**
     * Functional Summary.
     *
     * Advances to the next round or finishes the game when "Next" is pressed.
     *
     * Execution flow.
     * - If the answer was incorrect, saves the final attempt to the API.
     * - Hides the feedback screen and resets selection.
     * - Increments `currentRound` up to `TOTAL_ROUNDS` or calls `finishGame`.
     *
     * @returns Promise<void>
     * @example
     * await advanceToNextRound();
     */
    const advanceToNextRound = async () => {

        // Compare the selected number with the correct one
        const correct = selectedNumber === currentNumber;
        const timeSeconds = (Date.now() - roundStartTime) / 1000;

        if (selectedNumber === null) {
            return;
        }

        if (sessionId && !correct) {
            try {


                await gamesAPI.saveRoundResultGame1(sessionId, {
                    round: currentRound,
                    numbers: availableNumbers.filter((n): n is number => n !== undefined),
                    selected_number: selectedNumber,
                    correct_number: currentNumber,
                    is_correct: false,
                    time_seconds: timeSeconds,
                    is_final_attempt: true,
                    attempts: attemptsCount,
                    hints: hintsCount
                });
            } catch (error) {
                console.error('Error saving final attempt:', error);
            }

            setTotalErrorsMade(prev => prev + 1);
            setRoundTimes(prev => [...prev, timeSeconds]);
        }

        // Hide feedback screen
        setShowFeedbackScreen(false);

        if (currentRound < TOTAL_ROUNDS) {
            setCurrentRound(prev => prev + 1);
        } else {
            finishGame();
        }
    };

    /**
     * Functional Summary.
     *
     * Ends the game session, calculates the total time, and sends it to the backend.
     *
     * Execution flow.
     * - Calculates the total time from `gameStartTime`.
     * - Calls `gamesAPI.finishGameSession` with the total time if `sessionId` exists.
     * - Sets `gameFinished = true` to trigger subsequent redirection.
     *
     * @returns Promise<void> that resolves when the session closure has been processed.
     * @example
     * await finishGame();
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

        // Anunciar fin del juego para lectores de pantalla
        announce(`¡Juego completado! Has acertado ${totalNumbersCorrect} de ${TOTAL_ROUNDS} rondas.`);
    };



    /**
     * Functional Summary.
     *
     * Handles the early exit from the game (Home button). If there is an ongoing session,
     * it attempts to close it by saving the elapsed time and then redirects to the appropriate
     * dashboard based on the user's role.
     *
     * @returns Promise<void>
     * @example
     * await handleEarlyExit();
     */
    const handleEarlyExit = async () => {
        // If there is an active session, save the current state
        if (sessionId) {

            try {
                // Finish the session
                const totalTimeSeconds = (Date.now() - gameStartTime) / 1000;
                await gamesAPI.finishGameSession(sessionId, totalTimeSeconds);
            } catch (error) {
                console.error('Error saving early exit:', error);
            }
        }

        // Redirect to the dashboard
        const dashboardRoute = user?.role == 'student' ? '/student/dashboard' : '/teacher/dashboard';
        router.push(dashboardRoute, "back", "pop");
    };

    /**
     * Functional Summary.
     *
     * Reproduces the pronunciation of a number by building the sequence of
     * necessary audio files (hundreds, tens, units, 'and', etc.) and
     * using `AudioManager` to play them sequentially.
     *
     * Execution flow.
     * - If `num` is `null` or audio is already playing, it exits immediately.
     * - Calculates the list of files to play according to numerical rules.
     * - Calls `audioManager.playSequential` with the appropriate paths based on the voice.
     *
     * @param num - NNumber to pronounce. If `null`, the function does nothing.
     * @returns void
     *
     * @example
     * speakNumber(42);
     */
    const speakNumber = (num: number | null) => {
        if (num === null) return;
        if (listeningAudio) return; // avoid multiple simultaneous playbacks
        // Build the sequence of files to play
        const filesForNumber = (n: number): string[] => {
            const files: string[] = [];

            // Direct cases
            if ((n >= 0 && n <= 30) || (n < 100 && n % 10 === 0) || n % 100 === 0 || n === 100) {
                files.push(`${n}.m4a`);
                return files;
            }

            // 31..99 compounds: tens + 'y' + units
            if (n > 30 && n < 100) {
                const unidades = n % 10;
                const decenas = n - unidades;
                files.push(`${decenas}.m4a`);
                files.push(`y.m4a`);
                files.push(`${unidades}.m4a`);
                return files;
            }

            // 101..999: hundreds + remainder
            if (n > 100 && n < 1000) {
                const centenas = Math.floor(n / 100) * 100;
                const resto = n % 100;

                // Hundreds
                if (centenas === 100) {
                    files.push(`ciento.m4a`);
                } else {
                    files.push(`${centenas}.m4a`); // 200,300,...900
                }

                // Add the remainder using the same rules as above
                if ((resto >= 0 && resto <= 30) || (resto < 100 && resto % 10 === 0) || resto % 100 === 0) {
                    files.push(`${resto}.m4a`);
                } else {
                    const unidades = resto % 10;
                    const decenas = resto - unidades;
                    files.push(`${decenas}.m4a`);
                    files.push(`y.m4a`);
                    files.push(`${unidades}.m4a`);
                }

                return files;
            }

            // 100 exacto
            if (n === 100) {
                files.push(`100.m4a`);
                return files;
            }

            return files;
        };

        // Play files sequentially using AudioManager with medium volume (essential for gameplay)
        const playFilesSequentially = async (files: string[]) => {
            if (!files || files.length === 0) return;

            setListeningAudio(true);

            try {
                const base = useWomanVoice ? '/assets/sounds/woman/' : '/assets/sounds/man/';
                const paths = files.map(f => `${base}${f}`);
                // Always use medium volume (1) for number pronunciation, regardless of user preferences
                // This is essential for gameplay in the "Asociar Números" game
                await audioManager.playSequentialWithVolume(paths, 1);
                // Anunciar después de reproducir el audio para no solaparse
                announce('Número reproducido. Selecciona tu respuesta.');
            } finally {
                setListeningAudio(false);
            }
        };

        const files = filesForNumber(num);
        if (files.length === 0) {
            console.warn('No audio files mapped for number', num);
            return;
        }

        // Launch playback (no await in the handler to avoid blocking the UI)
        void playFilesSequentially(files);
    };

    // Clean up audio when the component unmounts
    useEffect(() => {
        return () => {
            try {
                audioManager.stop();
                setListeningAudio(false);
            } catch (e) { /* ignore */ }
        };
    }, []);

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
        const dashboardRoute = user?.role === "student" ? '/student/dashboard' : '/teacher/dashboard';
        router.push(dashboardRoute, "root", "push");
    };

    /**
     * Opens the video modal with instructions.
     *
     * @returns void
     * @example
     * openVideoModal();
     */
    const openVideoModal = () => {
        setShowVideoModal(true);
    };

    /**
     * Closes the video modal and stops playback if active.
     *
     * @returns void
     * @example
     * closeVideoModal();
     */
    const closeVideoModal = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
        setShowVideoModal(false);
    };

    // Authentication loading screen
    if (authLoading) {
        return (
            <IonPage>
                <IonContent>
                    <div className='Game1-spinner'>
                        <LoadingSpinner message="Cargando juego 1" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!user) {
        return <Redirect to="/student/login" />;
    }

    // Game loading screen
    if (loadingGame || loadingMessages) {
        return (
            <IonPage>
                <IonContent>
                    <div className='Game1-spinner'>
                        <LoadingSpinner message="Cargando juego 1" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Show feedback screen after checking answer
    if (showFeedbackScreen) {
        return (
            <FeedbackScreen
                isCorrect={isCorrectAnswer}
                currentRound={currentRound}
                totalRounds={TOTAL_ROUNDS}
                headerTitle="Asociar Nº"
                headerPictogram1={imgSonido}
                headerPictogramArrow={imgFlecha}
                headerPictogram2={imgJuego}
                messages={Messages}
                onNext={advanceToNextRound}
                onHomeClick={handleEarlyExit}
                onRepeat={repeatExercise}
                audioPreferences={audioPreferences}
            />
        );
    }

    return (
        <IonPage>
            <IonContent className="game1-content">
                {/* Aria live region for accessibility announcements */}
                <div
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                    style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        padding: 0,
                        margin: '-1px',
                        overflow: 'hidden',
                        clip: 'rect(0, 0, 0, 0)',
                        whiteSpace: 'nowrap',
                        border: 0
                    }}
                >
                    {liveAnnouncement}
                </div>

                {gameFinished ? (
                    <ResultsScreen
                        totalRounds={TOTAL_ROUNDS}
                        totalHints={totalHintsUsed}
                        totalErrors={totalErrorsMade}
                        totalNumbersCorrect={totalNumbersCorrect}
                        totalNumbersRequired={5}
                        onHomeClick={exitToDashboard}
                        headerTitle="Asociar Nº"
                        headerPictogram1={imgSonido}
                        headerPictogramArrow={imgFlecha}
                        headerPictogram2={imgJuego}
                        elapsedTime={Math.round(roundTimes.reduce((acc, time) => acc + time, 0))}
                        audioPreferences={audioPreferences}
                        game_id={1}
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
                            title="Asociar Nº"
                            pictogram1={imgSonido}
                            pictogramArrow={imgFlecha}
                            pictogram2={imgJuego}
                            currentRound={currentRound}
                            totalRounds={TOTAL_ROUNDS}
                            onBackClick={() => setShowExitConfirm(true)}
                        />

                        {/* Game area with grid layout */}
                        {/* <div className="game1-grid-container">
                            {/* <div className='game1-tato-column'>
                                <img src={imgTato} alt="Tato" className="game1-tato-image" />
                            </div> */}
                        <div className="game1-game-column">
                            {/* Available numbers */}
                            <BubblesZone
                                availableNumbers={availableNumbers}
                                selectedNumber={selectedNumber}
                                setSelectedNumber={setSelectedNumber}
                                showFeedback={showFeedbackScreen}
                                currentNumber={currentNumber}
                                usePictograms={usePictograms}
                                hintsUsed={hintsUsed}
                            />


                            {/* Control buttons */}
                            <div className="game1-buttons-container">
                                {/* Listen button */}
                                <GameControlButton
                                    aria-label="Escuchar número"
                                    disabled={listeningAudio}
                                    onClick={() => speakNumber(currentNumber)}
                                >
                                    <img
                                        src={imgSonido}
                                        alt=""
                                        aria-hidden="true"
                                        className="game-control-button-image"
                                    />
                                    <span className="game-control-button-text" aria-hidden="true">
                                        ESCUCHAR
                                    </span>
                                </GameControlButton>

                                {/* Video button - always visible on the left */}
                                <GameControlButton
                                    aria-label="Ver tutorial en video"
                                    onClick={openVideoModal}
                                >
                                    <img
                                        src={imgInstrucciones}
                                        alt=""
                                        aria-hidden="true"
                                        className="game-control-button-image"
                                    />
                                    <span className="game-control-button-text" aria-hidden="true">
                                        TUTORIAL
                                    </span>
                                </GameControlButton>

                                {/* Hint button */}
                                <GameControlButton
                                    aria-label="Usar pista"
                                    onClick={useHint}
                                    disabled={hintsUsed.length >= availableNumbers.length - 1}
                                >
                                    <img
                                        src={imgPista}
                                        alt=""
                                        aria-hidden="true"
                                        className="game-control-button-image"
                                    />
                                    <span className="game-control-button-text" aria-hidden="true">
                                        PISTA
                                    </span>
                                </GameControlButton>

                                {/* Accept/Check button */}
                                <GameControlButton
                                    aria-label="Comprobar respuesta"
                                    onClick={checkAnswer}
                                    disabled={selectedNumber === null}
                                >
                                    <img
                                        src={imgAceptar}
                                        alt=""
                                        aria-hidden="true"
                                        className="game-control-button-image"
                                    />
                                    <span className="game-control-button-text" aria-hidden="true">
                                        ACEPTAR
                                    </span>
                                </GameControlButton>

                            </div>
                        </div>
                        {/* </div> */}
                        {/* End grid container */}
                    </>
                )}
                {/* Video Modal */}
                {showVideoModal && (
                    <div className="game1-video-modal-overlay" onClick={closeVideoModal}>
                        <div className="game1-video-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button
                                className="game1-video-close-button"
                                onClick={closeVideoModal}
                                aria-label="Cerrar video tutorial">
                                ✕
                            </button>
                            <video
                                ref={videoRef}
                                controls
                                autoPlay
                                className="game1-video-player"
                            >
                                <source src="/assets/videos/video_game1.mp4" type="video/mp4" />
                                Tu navegador no soporta la reproducción de videos.
                            </video>
                        </div>
                    </div>
                )}

            </IonContent>
        </IonPage>
    );


};

export default Game1;