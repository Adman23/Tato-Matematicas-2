/**
 * Juego 1: Relacionar sonido con número
 *
 * El estudiante escucha un sonido que representa un número y debe
 * seleccionar el número correcto entre varias opciones.
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


import Game2Header from '../Game2Header';
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
 * Componente principal del Juego 1: Relacionar sonido con número.
 *
 * Este juego educativo presenta números que el usuario debe relacionar
 * con el sonido correspondiente.
 *
 * Características principales:
 * - Disponible para estudiantes y profesores con las mismas características
 * - 5 rondas con números aleatorios diferentes
 * - Pictogramas visuales para el rango 0-10
 * - Validación con feedback inmediato (check/cruz)
 * - Tracking completo en backend (tiempo, intentos, resultados)
 *
 * Flujo del juego:
 * 1. Carga configuración personalizada del usuario
 * 2. Crea sesión de juego en BD
 * 3. Por cada ronda:
 *    - Genera un número aleatorio para escuchar
 *    - Aparecen varias opciones visuales
 *    - Usuario selecciona una opción
 *    - Proporciona feedback visual inmediato
 *    - Valida y guarda resultado
 * 4. Tras 5 rondas, finaliza sesión y redirige al dashboard correspondiente
 *
 * @returns Componente React con UI completa del juego
 *
 * @example
 * // Usado en el routing de la app:
 * <Route path="/game1" component={Game1} />
 */
const Game1: React.FC = () => {

    const history = useHistory();
    const { user, loading: authLoading } = useAuth();

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
    const [currentNumber, setCurrentNumber] = useState<number | null>(null);
    const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
    const [usedNumbers, setUsedNumbers] = useState<number[]>([]);


    // Estados de UI
    const [showFeedback, setShowFeedback] = useState(false);
    const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
    const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
    const [listeningAudio, setListeningAudio] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Estados de resultados
    const [gameFinished, setGameFinished] = useState(false);


    // Determinar si usar pictogramas (solo para rango 0-10)
    const usePictograms = config?.number_range === '0-10';

    // Determinar si usar voz femenina o masculina
    const useWomanVoice = config?.settings?.voice === 'woman';
    console.log(config);

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
        if (config && sessionId && currentRound <= TOTAL_ROUNDS) {
            generateRound();
        }

    }, [config, currentRound, sessionId]);
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
     * 2. Llama a la API para obtener la config del juego 'touch_number'
     * 3. Valida que la configuración recibida sea correcta, o usa valores por defecto
     * 4. Actualiza el estado con la configuración recibida (rango, cantidad, orden)
     * 5. Desactiva el indicador de carga
     *
     * @returns Promesa que resuelve cuando se carga la configuración
     *
     * @example
     * // Al montar el componente se carga automáticamente:
     * // config = { number_range: '0-10', settings: { quantity: 5 } }
     */
    const loadGameConfig = async () => {
        try {
            if (!currentUser?.id) return;

            const data = await gamesAPI.getGameConfig(currentUser.id, 'touch_number');

            // Validar que la configuración tenga valores válidos
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

            // Si falla la carga, usar configuración por defecto
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

            const data = await gamesAPI.createGameSession(currentUser.id, 'touch_number');
            setSessionId(data.session_id);
        } catch (error) {
            console.error('Error creating game session:', error);
        }
    };

    /**
      * Genera los números y configuración para una nueva ronda del juego.
      *
      * Flujo de ejecución:
      * 1. Calcula cantidad de opciones: números entre los que elegir el correcto
      * 2. Genera número que se va a escuchar (currentNumber)
      * 3. Si el número ya se ha usado en otra ronda, genera otro
      * 4. Genera números únicos aleatorios dentro del rango configurado
      * 5. Añade a la lista el número correcto
      * 6. Mezcla los números disponibles para que no estén en orden
      * 7. Reinicia el timer de la ronda
      *
      * @returns void - Actualiza múltiples estados del componente
      *
      * @example
      * // Si config.settings.options_count = 5:
      * // - Genera 4 números
      * // - currentNumber = 9 (número a escuchar)
      * // - availableNumbers = [2, 9, 5, 12, 7] (mezclados, sin ayuda)
      */
    const generateRound = () => {
        if (!config) return;

        const [min, max] = config.number_range.split('-').map(Number);

        // Validar que min y max sean números válidos
        if (isNaN(min) || isNaN(max) || min >= max) {
            console.error('Invalid number range:', config.number_range);
            return;
        }

        const totalNumbers = config.settings.options_count || 5; // opciones disponibles

        // Validar que totalNumbers sea un número válido
        if (isNaN(totalNumbers) || totalNumbers <= 0) {
            console.error('Invalid totalNumbers:', config.settings.options_count);
            return;
        }

        // Calcular números disponibles en el rango
        const availableInRange = max - min + 1;

        // Validar que no se pidan más números de los disponibles en el rango
        if (totalNumbers > availableInRange) {
            console.error(
                `Cannot generate ${totalNumbers} unique numbers from range ${min}-${max} (only ${availableInRange} available). ` +
                `Please reduce options_count or increase range.`
            );
            // Ajustar totalNumbers al máximo disponible
            const adjustedTotal = availableInRange;

            console.warn(`Adjusting: options_count=${adjustedTotal}`);

            // Usar todos los números del rango
            const numbers = new Set<number>();
            for (let i = min; i <= max; i++) {
                numbers.add(i);
            }

            const numbersArray = Array.from(numbers);

            // Mezclar aleatoriamente los números disponibles
            const poolNumbers = numbersArray.sort(() => Math.random() - 0.5);

            // Generar número a escuchar (currentNumber)
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

        // Generar totalNumbers números únicos aleatorios
        const numbers = new Set<number>();
        while (numbers.size < totalNumbers) {
            const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
            numbers.add(randomNum);
        }

        const numbersArray = Array.from(numbers);

        // Generar número a escuchar (currentNumber)
        let roundNumber: number;
        do {
            roundNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (usedNumbers.includes(roundNumber) && usedNumbers.length < numbersArray.length);

        // Asegurarse de que el número correcto esté en las opciones
        if (!numbers.has(roundNumber)) {
            // Reemplazar un número aleatorio por el correcto
            const replaceIndex = Math.floor(Math.random() * numbersArray.length);
            numbersArray[replaceIndex] = roundNumber;
        }

        // Mezclar aleatoriamente los números disponibles (para que no estén en orden)
        const poolNumbers = numbersArray.sort(() => Math.random() - 0.5);

        setCurrentNumber(roundNumber);
        setUsedNumbers(prev => [...prev, roundNumber]);
        setAvailableNumbers(poolNumbers);
        console.log('Generated round', currentRound, 'with numbers:', poolNumbers);
        setShowFeedback(false);
        setRoundStartTime(Date.now());
    };


    /**
     * Valida la respuesta del usuario y guarda el resultado de la ronda.
     *
     * Flujo de ejecución:
     * 1. Calcula el tiempo transcurrido en la ronda
     * 2. Compara el número seleccionado con el correcto
     * 3. Muestra feedback visual (botón verde/rojo, iconos check/cruz)
     * 4. Guarda el resultado en el backend vía API
     * 5. Tras 2 segundos, avanza a la siguiente ronda o finaliza el juego
     *
     * @returns Promesa que resuelve cuando se completa la validación
     *
     * @example
     * // Usuario selecciona número 7 cuando el correcto es 7:
     * // → is_correct = true, muestra botón verde "¡Correcto!"
     * // → Guarda en BD y avanza a ronda 2
     */
    const checkAnswer = async () => {
        // Verificar que haya un número seleccionado
        if (selectedNumber === null) {
            return;
        }

        const timeSeconds = (Date.now() - roundStartTime) / 1000;

        // Comparar el número seleccionado con el correcto
        const correct = selectedNumber === currentNumber;

        // Mostrar feedback y guardar el resultado en backend.
        // No avanzamos automáticamente: esperamos a que el usuario pulse 'siguiente'.
        setShowFeedback(true);

        // Guardar en el backend
        if (sessionId) {
            try {
                await gamesAPI.saveRoundResultGame1(sessionId, {
                    round: currentRound,
                    numbers: availableNumbers.filter((n): n is number => n !== undefined),
                    selected_number: selectedNumber,
                    correct_number: currentNumber,
                    is_correct: correct,
                    time_seconds: timeSeconds
                });
            } catch (error) {
                console.error('Error saving round:', error);
            }
        }
    };

    // Avanzar al siguiente paso cuando el usuario pulse 'siguiente' en la pantalla de feedback
    const handleNext = () => {
        // Reset de selección y ocultar feedback
        setShowFeedback(false);
        setSelectedNumber(null);

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
     * Reproduce el sonido del número actual.
     * - Busca un archivo en /assets/sounds/ con el nombre en español (uno.mp3, dos.mp3, ...)
     * - Si la reproducción falla o no existe el fichero, usa speechSynthesis como fallback
     */
    const speakNumber = (num: number | null) => {
        if (num === null) return;
        if (listeningAudio) return; // evitar múltiples reproducciones simultáneas
        // Construir la secuencia de ficheros que hay que reproducir
        const filesForNumber = (n: number): string[] => {
            const files: string[] = [];

            // Casos directos
            if ((n >= 0 && n <= 30) || (n < 100 && n % 10 === 0) || n % 100 === 0 || n === 100) {
                files.push(`${n}.m4a`);
                return files;
            }

            // 31..99 compuestos: decena + 'y' + unidad
            if (n > 30 && n < 100) {
                const unidades = n % 10;
                const decenas = n - unidades;
                files.push(`${decenas}.m4a`);
                files.push(`y.m4a`);
                files.push(`${unidades}.m4a`);
                return files;
            }

            // 101..999: cientos + resto
            if (n > 100 && n < 1000) {
                const centenas = Math.floor(n / 100) * 100;
                const resto = n % 100;

                // Centenas
                if (centenas === 100) {
                    files.push(`ciento.m4a`);
                } else {
                    files.push(`${centenas}.m4a`); // 200,300,...900
                }

                // Añadir el resto usando las mismas reglas que arriba
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


        // Reproduce una secuencia de archivos de audio de forma secuenciall pat
        const playFilesSequentially = async (files: string[]) => {
            if (!files || files.length === 0) return;

            setListeningAudio(true);

            for (const f of files) {

                if (useWomanVoice) {
                    path = `/assets/sounds/woman/${f}`;
                } else {
                    path = `/assets/sounds/man/${f}`;
                }


                // Detener audio anterior si existe
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

        // Lanzar la reproducción (no await en el handler para no bloquear la UI)
        void playFilesSequentially(files);
    };

    // Limpiar audio cuando se desmonte el componente
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

    // Pantalla de carga de autenticación
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

    // Pantalla de carga del juego
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
            <IonContent className="game1-content">
                {/* Header */}
                <Game2Header
                    title="Asociar Nº"
                    pictogram1={imgSonido}
                    pictogramArrow={imgFlecha}
                    pictogram2={imgJuego}
                    currentRound={currentRound}
                    totalRounds={TOTAL_ROUNDS}
                />

                {/* Zona de juego */}
                {/* Números disponibles */}

                <BubblesZone
                    availableNumbers={availableNumbers}
                    selectedNumber={selectedNumber}
                    setSelectedNumber={setSelectedNumber}
                    showFeedback={showFeedback}
                    currentNumber={currentNumber}
                    usePictograms={usePictograms}
                />

                <div className='game1-footer'>
                    {/*Tato*/}
                    <div className="game1-tato-container">
                        <img
                            src={
                                showFeedback
                                    ? (selectedNumber === currentNumber ? imgTatoFeliz : imgTatoTriste)
                                    : imgTato
                            }
                            alt="Tato"
                            className="game1-tato-image"
                        />
                    </div>

                    {/*Botón de escuchar*/}
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


                    {/*Botón de comprobar*/}
                    <div className="game1-check-button-container">
                        <IonButton
                            fill="clear"
                            className="game1-check-button"
                            onClick={showFeedback ? handleNext : checkAnswer}
                            disabled={!showFeedback && selectedNumber === null}
                        >
                            <img
                                src={showFeedback ? imgSiguiente : imgAceptar}
                                alt={showFeedback ? 'Siguiente' : 'Comprobar'}
                                className="game1-check-button-image"
                            />
                        </IonButton>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );


};

export default Game1;