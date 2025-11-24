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
    messages: StudentMessage[];
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

    // Play correct or incorrect sound when component mounts using central AudioManager
    useEffect(() => {
        const soundPath = isCorrect ? '/assets/sounds/correct.mp3' : '/assets/sounds/incorrect.mp3';

        void audioManager.play(soundPath);

        // Cleanup: stop playback when the component unmounts
        return () => {
            try {
                audioManager.stop();
            } catch (e) { /* ignore */ }
        };
    }, [isCorrect]);


    // Choose a single message to show depending on isCorrect and available messages
    const selectedMessage = useMemo(() => {
        try {
            if (messages && messages.length > 0) {
                // Filter messages by type
                if (isCorrect) {
                    const positive = messages
                        .filter((m) => m.type === 'positive')
                        .map((m) => m.text_message as string);

                    return positive[Math.floor(Math.random() * positive.length)];
                }
                else {
                    const reinforcement = messages
                        .filter((m) => m.type === 'reinforcement' && !!m.text_message)
                        .map((m) => m.text_message as string);

                    return reinforcement[Math.floor(Math.random() * reinforcement.length)];
                }
            }
        }
        catch (e) {
            // In case of unexpected data, return a safe default
            return isCorrect ? "¡Muy bien!" : "¡Inténtalo de nuevo!";
        }
    }, [isCorrect, messages]);

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
                        <p>{selectedMessage}</p>
                    </div>

                    {/* Tato happy or sad */}
                    <div className="game1-feedback-tato">
                        <img
                            src={isCorrect ? imgTatoFeliz : imgTatoTriste}
                            alt={isCorrect ? "Tato feliz" : "Tato triste"}
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
