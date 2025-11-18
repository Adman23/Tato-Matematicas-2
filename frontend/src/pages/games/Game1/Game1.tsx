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
    IonSpinner,
    IonText,
    IonButton
} from '@ionic/react';
import { useHistory, Redirect } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext';
import { gamesAPI } from '../../../lib/api';
import type { GameConfig } from '../../../lib/api';

import GameHeader from '../GameHeader';
import './Game1.css';


// Importar imágenes para el header
import imgAceptar from '/assets/juegosImg/aceptar.png';
import imgSonido from '/assets/juegosImg/game1/sonido.png';
import imgJuego from '/assets/juegosImg/juegoX.png';
import imgSonidoConTexto from '/assets/juegosImg/game1/sonido_con_texto.png';
import imgSiguiente from '/assets/juegosImg/siguiente.png';

// Flecha desde assets
const imgFlecha = '/assets/juegosImg/flecha.png';

// Importar imagen de Tato
import imgTato from '/assets/Tato/Tato.png';
import imgTatoFeliz from '/assets/Tato/TatoFeliz.png';
import imgTatoTriste from '/assets/Tato/TatoTriste.png';
import BubblesZone from './BubblesZone';

// (Now using NumberPictogram component which resolves pictogram path for 0-10)

const TOTAL_ROUNDS = 5;


/**
 * Main component: Associate Sound with Number.
 *
 * This educational game presents numbers that the user must associate
 * with the corresponding sound.
 *
 * Main features:
 * - Available for students and teachers with the same features
 * - 5 rounds with different random numbers
 * - Visual pictograms for the range 0-10
 * - Validation with immediate feedback (check/cross)
 * - Complete tracking in backend (time, attempts, results)
 *
 * Game flow:
 * 1. Load user-customized configuration
 * 2. Create game session in DB
 * 3. For each round:
 *    - Generate a random number to listen to
 *    - Display several visual options
 *    - User selects an option
 *    - Provide immediate visual feedback
 *    - Validate and save result
 * 4. After 5 rounds, end session and redirect to the appropriate dashboard
 *
 * @returns React component with complete game UI
 *
 * @example
 * // Used in app routing:
 * <Route path="/game1" component={Game1} />
 */
const Game1: React.FC = () => {

    const history = useHistory();
    const { user, loading: authLoading } = useAuth();

    const currentUser = user;

    // Flag to prevent duplicate session creation (React 18 StrictMode)
    const sessionCreatedRef = useRef(false);

    // Main states
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<GameConfig | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Game states
    const [currentRound, setCurrentRound] = useState(1);
    const [availableNumbers, setAvailableNumbers] = useState<(number | undefined)[]>([]);
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
    const [usedNumbers, setUsedNumbers] = useState<number[]>([]);

    // Clues
    const [hintsUsed, setHintsUsed] = useState<number[]>([]);
    const [hintsCount, setHintsCount] = useState(0);


    // UI states
    const [showFeedback, setShowFeedback] = useState(false);
    const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
    const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
    const [listeningAudio, setListeningAudio] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Result states
    const [gameFinished, setGameFinished] = useState(false);


    // Determine if pictograms should be used (only for range 0-10)
    const usePictograms = config?.number_range === '0-10';

    // Determine if female or male voice should be used
    const useWomanVoice = config?.settings?.voice === 'woman';

    // Load configuration on mount (only once)
    useEffect(() => {
        loadGameConfig();
        setGameStartTime(Date.now());
    },
        []);

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
    // Effect to redirect when the game finishes
    useEffect(() => {
        if (gameFinished) {
            const timer = setTimeout(() => {
                // Redirect to the appropriate dashboard based on user type
                const dashboardRoute = user?.role === "student" ? '/student-dashboard' : '/tutor-dashboard';
                history.push(dashboardRoute);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [gameFinished, history, user]);


    /**
     * Load the custom game configuration from the backend.
     *
     * Execution flow:
     * 1. Verify that an authenticated user exists (student or teacher)
     * 2. Call the API to get the config for the 'touch_number' game
     * 3. Validate that the received configuration is correct, or use default values
     * 4. Update the state with the received configuration (range, quantity, order)
     * 5. Disable the loading indicator
     *
     * @returns Promise that resolves when the configuration is loaded
     *
     * @example
     * // When the component mounts, it loads automatically:
     * // config = { number_range: '0-10', settings: { quantity: 5 } }
     */
    const loadGameConfig = async () => {
        try {
            if (!currentUser?.id) return;

            const data = await gamesAPI.getGameConfig(currentUser.id, 'touch_number');

            // Validate that the configuration has valid values
            const validatedConfig: GameConfig = {
                ...data,
                number_range: data.number_range,
                settings: {
                    options_count: data.settings?.options_count,
                    voice: data.settings?.voice
                }
            };

            setConfig(validatedConfig);
            setLoading(false);
        } catch (error) {
            console.error('Error loading game config:', error);

            // If loading fails, use default configuration
            const defaultConfig: GameConfig = {
                game_id: 0,
                game_key: 'touch_number',
                user_id: currentUser?.id || '',
                number_range: '0-10',
                settings: {
                    options_count: 5,
                    voice: 'woman'
                }
            };

            setConfig(defaultConfig);
            setLoading(false);
        }
    };


    /**
     * Create a new game session in the backend for progress tracking.
     *
     * Execution flow:
     * 1. Verify that an authenticated user exists (student or teacher)
     * 2. Call the API to create a session linked to the user and game
     * 3. Save the session_id in state to use it when saving rounds
     * 4. The session_id allows linking all rounds to this game session
     *
     * @returns Promise that resolves when the session is created
     *
     * @example
     * // When the component mounts:
     * // sessionId = 'uuid-session-789' (saved in state)
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
      * Generates the numbers and configuration for a new game round.
      *
      * Execution flow:
      * 1. Calculates the number of options: numbers among which to choose the correct one
      * 2. Generates the number to be heard (currentNumber)
      * 3. If the number has already been used in another round, generates another one
      * 4. Generates unique random numbers within the configured range
      * 5. Adds the correct number to the list
      * 6. Shuffles the available numbers so they are not in order
      * 7. Resets the round timer
      *
      * @returns void - Updates multiple component states
      *
      * @example
      * // If config.settings.options_count = 5:
      * // - Generates 4 numbers
      * // - currentNumber = 9 (number to be heard)
      * // - availableNumbers = [2, 9, 5, 12, 7] (shuffled, without hints)
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
                `Please reduce options_count or increase range.`
            );
            // Adjust totalNumbers to the maximum available
            const adjustedTotal = availableInRange;

            console.warn(`Adjusting: options_count=${adjustedTotal}`);

            // Use all numbers in the range
            const numbers = new Set<number>();
            for (let i = min; i <= max; i++) {
                numbers.add(i);
            }

            const numbersArray = Array.from(numbers);

            // Shuffle the available numbers randomly
            const poolNumbers = numbersArray.sort(() => Math.random() - 0.5);

            // Generate number to be heard (currentNumber)
            let roundNumber: number;
            do {
                roundNumber = Math.floor(Math.random() * (max - min + 1)) + min;
            } while (usedNumbers.includes(roundNumber) && usedNumbers.length < numbersArray.length);

            setCurrentNumber(roundNumber);
            setUsedNumbers(prev => [...prev, roundNumber]);
            setAvailableNumbers(poolNumbers);
            setShowFeedback(false);
            setRoundStartTime(Date.now());
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
        setShowFeedback(false);
        setRoundStartTime(Date.now());
    };


    /**
     * Provides a hint by removing an incorrect option from the available numbers.
     *
     * @remarks
     * This function finds the first available number that is not the correct answer
     * and has not already been used as a hint. It then marks that number as "hinted",
     * which will disable it and reduce its opacity in the UI.
     *
     * @returns void
     */
    const useHint = () => {
        // No hints when feedback is shown
        if (showFeedback) return;

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

        console.log(`Pista usada: se ha deshabilitado el número ${hintNumber}`);
    };

    /**
     * Validates the user's answer and saves the round result.
     *
     * Execution flow:
     * 1. Calculates the elapsed time in the round
     * 2. Compares the selected number with the correct one
     * 3. Shows visual feedback (green/red button, check/cross icons)
     * 4. Saves the result in the backend via API
     * 5. After 2 seconds, advances to the next round or finishes the game
     *
     * @returns Promise that resolves when validation is complete
     *
     * @example
     * // User selects number 7 when the correct one is 7:
     * // → is_correct = true, shows green "Correct!" button
     * // → Saves in DB and advances to round 2
     */
    const checkAnswer = async () => {
        // Verify that a number is selected
        if (selectedNumber === null) {
            return;
        }

        const timeSeconds = (Date.now() - roundStartTime) / 1000;

        // Compare the selected number with the correct one
        const correct = selectedNumber === currentNumber;

        // Show feedback and save the result in the backend.
        // We do not advance automatically: we wait for the user to press 'next'.
        setShowFeedback(true);

        // Save in the backend
        if (sessionId) {
            try {
                await gamesAPI.saveRoundResultGame1(sessionId, {
                    round: currentRound,
                    numbers: availableNumbers.filter((n): n is number => n !== undefined),
                    selected_number: selectedNumber,
                    correct_number: currentNumber,
                    is_correct: correct,
                    time_seconds: timeSeconds,
                    hints: hintsCount
                });
            } catch (error) {
                console.error('Error saving round:', error);
            }
        }
    };

    /**
     * Advances to the next round or finishes the game when the user presses "next".
     *
     * Effects:
     * - Resets the number selection and hides the feedback.
     * - Increments `currentRound` up to `TOTAL_ROUNDS` or calls {@link finishGame} if the
     *   total number of rounds has been completed.
     *
     * @returns void
     */
    const handleNext = () => {
        // Reset the selection and hide feedback
        setShowFeedback(false);
        setSelectedNumber(null);
        // Reset hints for the new round
        setHintsUsed([]);
        setHintsCount(0);

        if (currentRound < TOTAL_ROUNDS) {
            setCurrentRound(prev => prev + 1);
        } else {
            finishGame();
        }
    };

    /**
     * Ends the game session and records the total time in the backend.
     *
     * Execution flow:
     * 1. Calculates the total time since the game started
     * 2. Sends the time to the backend to close the session
     * 3. Marks the game as finished in the state
     * 4. The useEffect redirects to the dashboard after 2 seconds
     *
     * @returns Promise that resolves when the session is finished
     *
     * @example
     * // When completing round 5:
     * // totalTimeSeconds = 150.2 (2 and a half minutes)
     * // → Saves in DB and sets gameFinished = true
     * // → Shows "Juego completado!" and redirects
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
     * Handles early exit from the game (home button).
     *
     * @remarks
     * If there is an active session in the backend, it tries to finish it by saving
     * the elapsed time. After that, it redirects to the dashboard according to the user's role.
     *
     * @returns Promise<void>
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
        const dashboardRoute = user?.role == 'student' ? '/student-dashboard' : '/tutor-dashboard';
        history.push(dashboardRoute);
    };

    /**
     * Plays the sound of the indicated number.
     *
     * @remarks
     * Builds the sequence of audio files needed to pronounce the number
     *
     * This function protects against concurrent playbacks using the
     * `listeningAudio` state and the `audioRef` reference.
     *
     * @param num - Number to play. If `null`, the function returns without action.
     * @returns void
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


        let path = '';


        // Play files sequentially
        const playFilesSequentially = async (files: string[]) => {
            if (!files || files.length === 0) return;

            setListeningAudio(true);

            for (const f of files) {

                if (useWomanVoice) {
                    path = `/assets/sounds/woman/${f}`;
                } else {
                    path = `/assets/sounds/man/${f}`;
                }


                // Stop previous audio if exists
                if (audioRef.current) {
                    try {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                    } catch (e) { /* ignore */ }
                    audioRef.current = null;
                }

                // Play single file and wait until it ends (or errors)
                await new Promise<void>((resolve) => {
                    const audio = new Audio(path);
                    audioRef.current = audio;

                    const finish = () => {
                        if (audioRef.current === audio) audioRef.current = null;
                        resolve();
                    };

                    audio.addEventListener('ended', finish);
                    audio.addEventListener('error', (err) => {
                        console.error('Error reproduciendo audio', path, err);
                        finish();
                    });

                    audio.play().catch((err) => {
                        console.error('play() falló para', path, err);
                        finish();
                    });
                });
            }

            setListeningAudio(false);
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
            if (audioRef.current) {
                try {
                    audioRef.current.pause();
                    audioRef.current = null;
                } catch (e) { /* ignore */ }
            }
        };
    }, []);

    // Authentication loading screen
    if (authLoading) {
        return (
            <IonPage>
                <IonContent>
                    <div className='Game1-spinner'>
                        <IonSpinner name="crescent" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!user) {
        return <Redirect to="/student-login" />;
    }

    // Game loading screen
    if (loading) {
        return (
            <IonPage>
                <IonContent>
                    <div className='Game1-spinner'>
                        <IonSpinner name="crescent" />
                        <IonText>
                            <p>Cargando juego...</p>
                        </IonText>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // If the game is finished, show message
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
            <IonContent className="game1-content">
                {/* Header */}
                <GameHeader
                    title="Asociar Nº"
                    pictogram1={imgSonido}
                    pictogramArrow={imgFlecha}
                    pictogram2={imgJuego}
                    currentRound={currentRound}
                    totalRounds={TOTAL_ROUNDS}
                    onHomeClick={handleEarlyExit}
                />

                {/* Game area */}
                {/* Available numbers */}

                <BubblesZone
                    availableNumbers={availableNumbers}
                    selectedNumber={selectedNumber}
                    setSelectedNumber={setSelectedNumber}
                    showFeedback={showFeedback}
                    currentNumber={currentNumber}
                    usePictograms={usePictograms}
                    hintsUsed={hintsUsed}
                />

                {/* Control buttons */}
                <div className="game1-buttons-container">
                    {/* Hint button - always visible on the left */}
                    <IonButton
                        fill="clear"
                        className="game1-check-button game1-hint-button"
                        onClick={useHint}
                        disabled={showFeedback}
                    >
                        <img
                            src={showFeedback && selectedNumber === currentNumber ? imgTatoFeliz :
                                showFeedback && selectedNumber !== currentNumber ? imgTatoTriste : imgTato}
                            alt="Pista"
                            className="game1-check-button-image"
                        />
                    </IonButton>

                    {/* Listen button */}
                    <div className="game1-check-button-container">
                        <IonButton
                            fill="clear"
                            className="game1-check-button"
                            disabled={listeningAudio || showFeedback}
                            onClick={() => speakNumber(currentNumber)}
                        >
                            <img
                                src={imgSonidoConTexto}
                                alt="Escuchar"
                                className="game1-check-button-image"
                            />
                        </IonButton>
                    </div>

                    {/* Accept/Check button when there is no feedback */}
                    {!showFeedback && (
                        <IonButton
                            fill="clear"
                            className="game1-check-button"
                            onClick={checkAnswer}
                        >
                            <img
                                src={imgAceptar}
                                alt="Comprobar"
                                className="game1-check-button-image"
                            />
                        </IonButton>
                    )}

                    {/* Arrow button to continue when correct */}
                    {showFeedback && (
                        <IonButton
                            fill="clear"
                            className="game1-check-button"
                            onClick={handleNext}
                        >
                            <img
                                src={imgSiguiente}
                                alt="Continuar"
                                className="game1-check-button-image"
                            />
                        </IonButton>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );


};

export default Game1;