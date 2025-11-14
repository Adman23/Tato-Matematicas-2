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
    IonButton,
    IonGrid,
    IonRow,
    IonCol

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
    const [triesCurrentNumber, setTriesCurrentNumber] = useState(false);
    const [usedNumbers, setUsedNumbers] = useState<number[]>([]);


    // Estados de UI
    const [showFeedback, setShowFeedback] = useState(false);
    const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
    const [gameStartTime, setGameStartTime] = useState<number>(Date.now());
    const [listeningAudio, setListeningAudio] = useState(false);

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
     * 
     * Función para reproducir el sonido de un número usando la API de síntesis de voz.
     * 
     * @param number 
     */
    function speakNumber(number: String | null) {
        if (number === null) return;

        const msg = new SpeechSynthesisUtterance(number.toString());
        msg.lang = "es-ES"; // puedes usar "es-MX" o "es-AR"
        msg.rate = 1;       // velocidad
        msg.pitch = 5;      // tono
        msg.volume = 1000;
        speechSynthesis.speak(msg);

        // // Comprobar soporte
        // if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        //     console.warn('Speech Synthesis no está soportado en este entorno');
        //     return;
        // }

        // const synth = window.speechSynthesis;

        // // Crea y habla con la voz opcionalmente elegida
        // const speakWithVoice = (voice: SpeechSynthesisVoice | null, text: string) => {
        //     // Cancelar cualquier reproducción previa para evitar solapamientos
        //     try { synth.cancel(); } catch (e) { /* noop */ }

        //     setListeningAudio(true);

        //     const msg = new SpeechSynthesisUtterance(text);
        //     msg.lang = 'es-ES';
        //     msg.rate = 1;
        //     msg.pitch = 1;
        //     msg.volume = 1;
        //     if (voice) msg.voice = voice;

        //     msg.onend = () => {
        //         setListeningAudio(false);
        //     };

        //     msg.onerror = (ev: SpeechSynthesisErrorEvent) => {
        //         console.error('TTS error:', ev);
        //         // Si falla la síntesis y hay otras voces, intentar otra voz una vez
        //         if (ev.error === 'synthesis-failed') {
        //             const allVoices = synth.getVoices();
        //             // Si había una voz y hay al menos otra, intentar con la primera disponible distinta
        //             const altVoice = allVoices.find(v => v !== voice) || null;
        //             if (altVoice) {
        //                 // quitar listeners y reintentar una vez
        //                 try { synth.cancel(); } catch (e) { }
        //                 // pequeña espera antes de reintentar
        //                 setTimeout(() => speakWithVoice(altVoice, text), 150);
        //                 return;
        //             }
        //         }

        //         setListeningAudio(false);
        //     };

        //     synth.speak(msg);
        // };

        // const textToSpeak = number.toString();

        // const voices = synth.getVoices();
        // if (!voices || voices.length === 0) {
        //     // Si aún no hay voces, esperar al evento 'voiceschanged' con fallback
        //     const onVoicesChanged = () => {
        //         const available = synth.getVoices() || [];
        //         const spanishVoice = available.find(v => v.lang && v.lang.toLowerCase().startsWith('es')) || available[0] || null;
        //         speakWithVoice(spanishVoice, textToSpeak);
        //         try { synth.removeEventListener('voiceschanged', onVoicesChanged); } catch (e) { }
        //     };

        //     synth.addEventListener('voiceschanged', onVoicesChanged);

        //     // Fallback: tras un timeout breve, si aparecen voces, hablar
        //     setTimeout(() => {
        //         const available = synth.getVoices() || [];
        //         if (available.length > 0) {
        //             try { synth.removeEventListener('voiceschanged', onVoicesChanged); } catch (e) { }
        //             const spanishVoice = available.find(v => v.lang && v.lang.toLowerCase().startsWith('es')) || available[0] || null;
        //             speakWithVoice(spanishVoice, textToSpeak);
        //         } else {
        //             // No hay voces: intentar hablar sin voz asignada
        //             speakWithVoice(null, textToSpeak);
        //         }
        //     }, 500);
        // } else {
        //     // Seleccionar preferentemente una voz en español
        //     const spanishVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('es')) || voices[0] || null;
        //     speakWithVoice(spanishVoice, textToSpeak);
        // }
    }

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
                number_range: data.number_range || '0-10',
                settings: {
                    options_count: data.settings?.options_count || 5
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
                    options_count: 5
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
                const randomIndex = Math.floor(Math.random() * numbersArray.length);
                roundNumber = numbersArray[randomIndex];
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
            const randomIndex = Math.floor(Math.random() * numbersArray.length);
            roundNumber = numbersArray[randomIndex];
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
                <p>{currentNumber}</p>

                <IonGrid className="numbers-grid">
                    <IonRow className="ion-justify-content-center">
                        {availableNumbers.map((num, index) => {
                            if (num === undefined) return null;

                            const pictogramImg = usePictograms && num <= 10 ? PICTOGRAM_IMAGES[num] : null;
                            let cardClass = 'number-circle'; // Usamos la clase del círculo
                            if (usePictograms) cardClass += ' number-card-pictogram';

                            // Añadir clase visual cuando esté seleccionado
                            const isSelected = selectedNumber === num;
                            if (isSelected) cardClass += ' selected';

                            // Si estamos mostrando feedback, marcar la opción correcta en verde
                            // y la opción seleccionada incorrecta en rojo.
                            if (showFeedback) {
                                // marcar la opción correcta (aunque no esté seleccionada)
                                if (num === currentNumber) {
                                    cardClass += ' correct';
                                }

                                // si el usuario seleccionó una opción equivocada, marcarla en rojo
                                if (selectedNumber !== null && selectedNumber === num && selectedNumber !== currentNumber) {
                                    cardClass += ' incorrect';
                                }
                            }

                            return (
                                <IonCol size="4" size-md="3" size-lg="2" key={`available-${num}-${index}`} className="ion-text-center">
                                    <div
                                        className={cardClass}
                                        onClick={() => {
                                            if (showFeedback) return; // no permitir cambios durante feedback
                                            setSelectedNumber(prev => (prev === num ? null : num));
                                        }}
                                        role="button"
                                        aria-pressed={isSelected}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                if (!showFeedback) {
                                                    setSelectedNumber(prev => (prev === num ? null : num));
                                                }
                                                e.preventDefault();
                                            }
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
                                </IonCol>
                            );
                        })}
                    </IonRow>
                </IonGrid>

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
                            onClick={() => speakNumber("Muy bieeeeeeeeen!!!!!!")}
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