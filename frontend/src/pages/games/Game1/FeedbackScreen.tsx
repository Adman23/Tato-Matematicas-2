/**
 * Functional Summary.
 *
 * Feedback screen used when validating an answer in the game.
 * Shows Tato's expression (happy/sad), plays a correct/incorrect sound,
 * and offers buttons to repeat or proceed to the next round.
 *
 * Execution flow.
 * - On mount, plays the corresponding sound (correct/incorrect) through
 *   the centralized `audioManager`.
 * - Offers actions: repeat the hint when the answer was incorrect and
 *   proceed to the next round.
 *
 * @example
 * <FeedbackScreen isCorrect={true} currentRound={1} totalRounds={5} imgSonido="..." imgFlecha="..." imgJuego="..." onNext={() => {}} onHomeClick={() => {}} />
 */

import React, { useEffect, useMemo } from 'react';
import {
    IonContent,
    IonPage,
    IonButton
} from '@ionic/react';

import './FeedbackScreen.css';

import GameHeader from '../GameHeader';
import audioManager from '../../../lib/AudioManager';

import imgSiguiente from '/assets/juegosImg/siguiente.png';
import imgRepetir from '/assets/juegosImg/volver.png';
import imgTatoFeliz from '/assets/Tato/TatoFeliz.png';
import imgTatoTriste from '/assets/Tato/TatoTriste.png';
import type { StudentMessage } from '../../../lib/api';


/**
 * Props for `FeedbackScreen`.
 *
 * @param isCorrect - Indicates if the answer was correct.
 * @param currentRound - Current round number.
 * @param totalRounds - Total rounds in the game.
 * @param imgSonido - Path to the sound pictogram image (header).
 * @param imgFlecha - Path to the arrow image (header).
 * @param imgJuego - Path to the game pictogram image (header).
 * @param onNext - Callback called when the "Next" button is pressed.
 * @param onHomeClick - Callback called when the home button is pressed.
 * @param onRepeat - Optional callback to repeat the hint when the answer is incorrect.
 * @param messages - Array of messages to display.
 *
 * @returns `FeedbackScreenProps` type used by the component.
 */
interface FeedbackScreenProps {
    isCorrect: boolean;
    currentRound: number;
    totalRounds: number;
    imgSonido: string;
    imgFlecha: string;
    imgJuego: string;
    messages?: StudentMessage[];
    onNext: () => void;
    onHomeClick: () => void;
    onRepeat?: () => void;
}

/**
 * `FeedbackScreen` component.
 *
 * Shows the result screen (happy/sad Tato), plays the result sound,
 * and exposes buttons to repeat or proceed.
 *
 * @param props - Props of the {@link FeedbackScreenProps} component.
 * @returns React element with the feedback interface.
 */
const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
    isCorrect,
    currentRound,
    totalRounds,
    imgSonido,
    imgFlecha,
    imgJuego,
    messages,
    onNext,
    onHomeClick,
    onRepeat
}) => {


    // Choose a single StudentMessage-like object to show depending on isCorrect and available messages
    const selectedMessage: StudentMessage = useMemo(() => {
        try {
            if (messages && messages.length > 0) {
                // Filter messages by type and keep only those with text
                const positive = messages.filter((m) => m.type === 'positive');
                const reinforcement = messages.filter((m) => m.type === 'reinforcement');

                if (isCorrect) {
                    if (positive.length > 0) {
                        return positive[Math.floor(Math.random() * positive.length)];
                    }
                    // fallback to default positive text
                    return {
                        id: 'default-positive',
                        type: 'positive',
                        text_message: "¡Muy bien!",
                        icon_url: null,
                        sound_url: null
                    };
                } else {
                    if (reinforcement.length > 0) {
                        return reinforcement[Math.floor(Math.random() * reinforcement.length)];
                    }
                    // fallback to default reinforcement text
                    return {
                        id: 'default-reinforcement',
                        type: 'reinforcement',
                        text_message: "Prueba otra vez",
                        icon_url: null,
                        sound_url: null
                    };
                }
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
                    totalRounds={totalRounds}
                    onHomeClick={onHomeClick}
                />

                {/* Feedback screen */}
                <div className="game1-feedback-screen">

                    {/* Message */}
                    <div className="game1-feedback-message">
                        <p>{selectedMessage.text_message}</p>
                    </div>

                    {/* Tato happy or sad (or message icon if provided) */}
                    <div className="game1-feedback-tato">
                        <img
                            src={selectedMessage?.icon_url ? "/assets/pictograms/" + selectedMessage.icon_url : (isCorrect ? imgTatoFeliz : imgTatoTriste)}
                            alt={selectedMessage?.icon_url ? 'Message icon' : (isCorrect ? 'Tato feliz' : 'Tato triste')}
                            className="game1-feedback-tato-image"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="game1-feedback-button-container">
                        {!isCorrect && (
                            <IonButton
                                fill="clear"
                                className="game1-check-button-feedback"
                                onClick={onRepeat}
                            >
                                {imgRepetir ? (
                                    <img
                                        src={imgRepetir}
                                        alt="Repetir"
                                        className="game1-check-button-feedback-image"
                                    />
                                ) : (
                                    <>Repetir</>
                                )}
                            </IonButton>
                        )}

                        <IonButton
                            fill="clear"
                            className="game1-check-button-feedback"
                            onClick={onNext}
                        >
                            <img
                                src={imgSiguiente}
                                alt="Siguiente"
                                className="game1-check-button-feedback-image"
                            />
                        </IonButton>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default FeedbackScreen;
