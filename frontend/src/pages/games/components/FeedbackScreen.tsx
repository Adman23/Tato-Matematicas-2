/**
 * Functional Summary.
 *
 * Unified feedback screen used when validating an answer in games.
 * Shows Tato's expression (happy/sad), displays personalized messages,
 * plays correct/incorrect sounds, and offers buttons to repeat or proceed
 * to the next round.
 *
 * This component is shared across all games to maintain consistency
 * and avoid code duplication.
 *
 *
 * @example
 * // Game1 usage
 * <FeedbackScreen
 *   isCorrect={true}
 *   currentRound={1}
 *   totalRounds={5}
 *   headerTitle="Asociar Nº"
 *   headerPictogram1={imgSonido}
 *   headerPictogramArrow={imgFlecha}
 *   headerPictogram2={imgJuego}
 *   messages={messages}
 *   onNext={() => {}}
 *   onHomeClick={() => {}}
 *   onRepeat={() => {}}
 * />
 *
 * // Game2 usage (without messages)
 * <FeedbackScreen
 *   isCorrect={true}
 *   currentRound={1}
 *   totalRounds={5}
 *   headerTitle="Ordenar Nº"
 *   headerPictogram1={imgOrdenar}
 *   headerPictogramArrow={imgFlecha}
 *   headerPictogram2={imgJuego}
 *   onNext={() => {}}
 *   onHomeClick={() => {}}
 * />
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    IonContent,
    IonPage
} from '@ionic/react';

import './FeedbackScreen.css';

import GameHeader from './GameHeader';
import ExitScreen from './ExitScreen';
import audioManager from '../../../lib/AudioManager';

import imgSiguienteDefault from '/assets/juegosImg/siguiente.png';
import imgRepetirDefault from '/assets/juegosImg/volver.png';
import imgTatoFelizDefault from '/assets/Tato/TatoFeliz.png';
import imgTatoTristeDefault from '/assets/Tato/TatoTriste.png';
import type { StudentMessage } from '../../../lib/api';
import { GameControlButton } from '../../global_components/GameControlButton';


/**
 * Props for `FeedbackScreen`.
 *
 * @param isCorrect - Indicates if the answer was correct.
 * @param currentRound - Current round number.
 * @param totalRounds - Total rounds in the game.
 * @param headerTitle - Title to display in the header (e.g., "Asociar Nº", "Ordenar Nº").
 * @param headerPictogram1 - Path to the first pictogram image for the header.
 * @param headerPictogramArrow - Path to the arrow image for the header.
 * @param headerPictogram2 - Path to the second pictogram image for the header.
 * @param imgTatoFeliz - Optional path to the happy Tato image (defaults to standard happy Tato).
 * @param imgTatoTriste - Optional path to the sad Tato image (defaults to standard sad Tato).
 * @param imgSiguiente - Optional path to the "next" button image (defaults to standard siguiente).
 * @param imgRepetir - Optional path to the "repeat" button image (defaults to standard volver).
 * @param messages - Optional array of personalized messages to display.
 * @param onNext - Callback called when the "Next" button is pressed.
 * @param onHomeClick - Callback called when the home button is pressed.
 * @param onRepeat - Optional callback to repeat the hint when the answer is incorrect.
 * @param enableHoverMode - If true, hovering over buttons triggers the same actions (accessibility).
 *
 * @returns `FeedbackScreenProps` type used by the component.
 */
interface FeedbackScreenProps {
    isCorrect: boolean;
    currentRound: number;
    totalRounds: number;
    headerTitle: string;
    headerPictogram1: string;
    headerPictogramArrow: string;
    headerPictogram2: string;
    imgTatoFeliz?: string;
    imgTatoTriste?: string;
    imgSiguiente?: string;
    imgRepetir?: string;
    messages?: StudentMessage[];
    onNext: () => void;
    onHomeClick: () => void;
    onRepeat?: () => void;
    hideNextOnError?: boolean; // Si es true, oculta el botón "Siguiente" cuando hay error
    enableHoverMode?: boolean;
}

/**
 * `FeedbackScreen` component.
 *
 * Shows the result screen (happy/sad Tato), displays personalized messages,
 * plays the result sound, and exposes buttons to repeat or proceed.
 *
 * @param props - Props of the {@link FeedbackScreenProps} component.
 * @returns React element with the feedback interface.
 */
const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
    isCorrect,
    currentRound,
    totalRounds,
    headerTitle,
    headerPictogram1,
    headerPictogramArrow,
    headerPictogram2,
    imgTatoFeliz = imgTatoFelizDefault,
    imgTatoTriste = imgTatoTristeDefault,
    imgSiguiente = imgSiguienteDefault,
    imgRepetir = imgRepetirDefault,
    messages,
    onNext,
    onHomeClick,
    onRepeat,
    hideNextOnError = false,
    enableHoverMode = false
}) => {
    // Estado para mostrar la pantalla de confirmación de salida
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const hoverTimer = useRef<number | null>(null);
    const HOVER_DELAY = 800;

    const handleKeyActivate = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            action();
        }
    };

    const triggerHover = (action?: () => void) => {
        if (!enableHoverMode || !action) return;
        if (hoverTimer.current) {
            window.clearTimeout(hoverTimer.current);
        }
        hoverTimer.current = window.setTimeout(() => {
            hoverTimer.current = null;
            action();
        }, HOVER_DELAY);
    };

    useEffect(() => {
        return () => {
            if (hoverTimer.current) {
                window.clearTimeout(hoverTimer.current);
            }
        };
    }, []);


    /**
    * Resumen Funcional.
    *
    * Devuelve el objeto `StudentMessage` que se debe mostrar en la pantalla
    * de feedback para la respuesta actual. La selección es secuencial por
    * tipo de mensaje: positivo o refuerzo.
    *
    * Flujo de ejecución.
    * - Lee el arreglo `messages` pasado por props (puede ser undefined).
    * - Filtra los mensajes por tipo (`positive` o `reinforcement`) según
    *   el booleano `isCorrect`.
    * - Lee el índice almacenado en `localStorage` bajo la clave
    *   `tato_feedback_idx_positive` o `tato_feedback_idx_reinforcement`.
    * - Calcula un índice seguro con módulo (`storedIndex % pool.length`) y
    *   devuelve el mensaje correspondiente. Si no hay mensajes del tipo
    *   solicitado, devuelve un mensaje por defecto apropiado.
    *
    * @param messages - Arreglo (opcional) de `StudentMessage` recibidos desde el contexto
    * @param isCorrect - Si true selecciona del pool de mensajes positivos, si false del de refuerzo
    * @returns `StudentMessage` listo para renderizar (incluye text_message, icon_url y sound_url)
    *
    * @example Ejemplo de uso
    * // Dentro del componente: const msg = selectedMessage; render <p>{msg.text_message}</p>
    */
    const selectedMessage: StudentMessage = useMemo(() => {
        try {
            if (messages && messages.length > 0) {
                // Filter messages by type and keep only those with text
                const positive = messages.filter((m) => m.type === 'positive');
                const reinforcement = messages.filter((m) => m.type === 'reinforcement');

                const pool = isCorrect ? positive : reinforcement;

                if (pool.length > 0) {
                    const key = isCorrect ? 'tato_feedback_idx_positive' : 'tato_feedback_idx_reinforcement';
                    const raw = localStorage.getItem(key);
                    const idx = raw ? Number(raw) : 0;
                    const safeIdx = Number.isFinite(idx) ? idx : 0;
                    return pool[safeIdx % pool.length];
                }

                // Fallbacks if no messages of the required type
                if (isCorrect) {
                    return {
                        id: 'default-positive',
                        type: 'positive',
                        text_message: "¡Muy bien!",
                        icon_url: null,
                        sound_url: null
                    };
                }
                return {
                    id: 'default-reinforcement',
                    type: 'reinforcement',
                    text_message: "Prueba otra vez",
                    icon_url: null,
                    sound_url: null
                };
            }

            // No messages provided -> return a default message object
            return {
                id: 'default-none',
                type: isCorrect ? 'positive' : 'reinforcement',
                text_message: isCorrect
                    ? "¡Muy bien!"
                    : "Prueba otra vez",
                icon_url: null,
                sound_url: null
            };
        } catch (e) {
            // Safe fallback
            return {
                id: 'default-error',
                type: isCorrect ? 'positive' : 'reinforcement',
                text_message: isCorrect ? '¡Muy bien!' : 'Prueba otra vez',
                icon_url: null,
                sound_url: null
            };
        }
    }, [isCorrect, messages]);

    /**
    * Resumen Funcional.
    *
    * Avanza el índice secuencial almacenado en `localStorage` para el pool
    * de mensajes actualmente mostrado (positivo o refuerzo). Este índice
    * determina qué mensaje se mostrará la próxima vez que se solicite
    * feedback. La función realiza la escritura en `localStorage` y no
    * devuelve valor.
    *
    * Flujo de ejecución.
    * - Filtra `messages` por tipo según `isCorrect` para obtener el pool.
    * - Lee el valor actual de la clave correspondiente en `localStorage`.
    * - Calcula `(current + 1) % pool.length` para obtener el siguiente
    *   índice y lo guarda de nuevo en `localStorage`.
    * - Silencia cualquier error de `localStorage` (por ejemplo en modo
    *   privado) para no romper la experiencia.
    *
    * @returns void
    *
    * @example Ejemplo de uso
    * // Llamar desde el handler del botón Siguiente:
    * // onClick={() => { incrementMessageIndex(); onNext(); }}
    */
    const incrementMessageIndex = () => {
        try {
            if (messages && messages.length > 0) {
                const positive = messages.filter((m) => m.type === 'positive');
                const reinforcement = messages.filter((m) => m.type === 'reinforcement');
                const pool = isCorrect ? positive : reinforcement;
                if (pool.length > 0) {
                    const key = isCorrect ? 'tato_feedback_idx_positive' : 'tato_feedback_idx_reinforcement';
                    const raw = localStorage.getItem(key);
                    const idx = raw ? Number(raw) : 0;
                    const safeIdx = Number.isFinite(idx) ? idx : 0;
                    const next = (safeIdx + 1) % pool.length;
                    localStorage.setItem(key, String(next));
                }
            }
        } catch (e) {
            // ignore localStorage errors (e.g., in private modes)
        }
    };

    // Play selected message sound (if present) or fallback to default correct/incorrect sound
    useEffect(() => {
        const soundPath = selectedMessage && selectedMessage.sound_url
            ? "/assets/sounds/" + selectedMessage.sound_url
            : (isCorrect ? '/assets/sounds/correct.mp3' : '/assets/sounds/incorrect.mp3');

        void audioManager.play(soundPath);

        return () => {
            try {
                audioManager.stop();
            } catch (e) { /* ignore */ }
        };
    }, [selectedMessage?.sound_url, isCorrect]);

    // Si se muestra la confirmación de salida, renderizar ExitScreen
    if (showExitConfirm) {
        return (
            <ExitScreen
                confirmExit={onHomeClick}
                cancelExit={() => setShowExitConfirm(false)}
                enableHoverMode={enableHoverMode}
            />
        );
    }

    return (
        <IonPage>
            <IonContent className="feedback-content">
                {/* Header */}
                <GameHeader
                    title={headerTitle}
                    pictogram1={headerPictogram1}
                    pictogramArrow={headerPictogramArrow}
                    pictogram2={headerPictogram2}
                    currentRound={currentRound}
                    totalRounds={totalRounds}
                    onBackClick={() => setShowExitConfirm(true)}
                    onBackHover={enableHoverMode ? () => triggerHover(() => setShowExitConfirm(true)) : undefined}
                />

                {/* Feedback screen */}
                <div className="feedback-screen">

                    {/* Message */}
                    <div className="feedback-message">
                        <p>{selectedMessage.text_message}</p>
                    </div>

                    {/* Tato happy or sad (or message icon if provided) */}
                    <div className="feedback-tato">
                        <img
                            src={selectedMessage?.icon_url ? "/assets/pictograms/" + selectedMessage.icon_url : (isCorrect ? imgTatoFeliz : imgTatoTriste)}
                            alt={selectedMessage?.icon_url ? 'Message icon' : (isCorrect ? 'Tato feliz' : 'Tato triste')}
                            className="feedback-tato-image"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="feedback-button-container">
                        {!isCorrect && onRepeat && (
                            <GameControlButton
                                onClick={onRepeat}
                                onMouseEnter={enableHoverMode ? onRepeat : undefined}
                                onKeyDown={(e) => handleKeyActivate(e, onRepeat)}
                                tabIndex={0}
                            >
                                <img
                                    src={imgRepetir}
                                    alt="Repetir"
                                    className="game-control-button-image"
                                />
                                <span className="game-control-button-text">
                                    REPETIR
                                </span>
                            </GameControlButton>
                        )}

                        {/* Mostrar botón "Siguiente" solo si: es correcto O (es incorrecto pero hideNextOnError es false) */}
                        {(isCorrect || !hideNextOnError) && (
                            <GameControlButton
                                onClick={() => { incrementMessageIndex(); onNext(); }}
                                onMouseEnter={
                                    enableHoverMode
                                        ? () => { incrementMessageIndex(); onNext(); }
                                        : undefined
                                }
                                onKeyDown={(e) => handleKeyActivate(e, () => { incrementMessageIndex(); onNext(); })}
                                tabIndex={0}
                            >
                                <img
                                    src={imgSiguiente}
                                    alt="Siguiente"
                                    className="game-control-button-image"
                                />
                                <span className="game-control-button-text">
                                    SIGUIENTE
                                </span>
                            </GameControlButton>
                        )}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default FeedbackScreen;
