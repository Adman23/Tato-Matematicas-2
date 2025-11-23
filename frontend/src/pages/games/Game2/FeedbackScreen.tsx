/**
 * FeedbackScreen Component for Game2
 *
 * Displays a full-screen feedback after the user places a number.
 * Shows Tato happy/sad and a button to continue.
 */

import React, { useEffect } from 'react';
import {
    IonButton
} from '@ionic/react';
import GameHeader from '../GameHeader';
import './FeedbackScreen.css';
import audioManager from '../../../lib/AudioManager';

interface FeedbackScreenProps {
    isCorrect: boolean;
    currentRound: number;
    totalRounds: number;
    imgTatoFeliz: string;
    imgTatoTriste: string;
    imgSiguiente: string;
    imgOrdenar: string;
    imgFlecha: string;
    imgJuego: string;
    onContinue: () => void;
    onHomeClick: () => void;
}

/**
 * FeedbackScreen component that shows the result of placing a number.
 *
 * @param isCorrect - Whether the number was placed correctly
 * @param currentRound - Current round number
 * @param totalRounds - Total number of rounds
 * @param imgTatoFeliz - Image path for happy Tato
 * @param imgTatoTriste - Image path for sad Tato
 * @param imgSiguiente - Image path for continue button
 * @param imgOrdenar - Image path for order pictogram
 * @param imgFlecha - Image path for arrow pictogram
 * @param imgJuego - Image path for game pictogram
 * @param onContinue - Callback when continue button is clicked
 * @param onHomeClick - Callback when home button is clicked
 */
const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
    isCorrect,
    currentRound,
    totalRounds,
    imgTatoFeliz,
    imgTatoTriste,
    imgSiguiente,
    imgOrdenar,
    imgFlecha,
    imgJuego,
    onContinue,
    onHomeClick
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

    return (
        <>
            {/* Header */}
            <GameHeader
                title="Ordenar Nº"
                pictogram1={imgOrdenar}
                pictogramArrow={imgFlecha}
                pictogram2={imgJuego}
                currentRound={currentRound}
                totalRounds={totalRounds}
                onHomeClick={onHomeClick}
            />

            {/* Feedback screen */}
            <div className="game2-feedback-screen">
                {/* Tato happy or sad */}
                <div className="game2-feedback-tato">
                    <img
                        src={isCorrect ? imgTatoFeliz : imgTatoTriste}
                        alt={isCorrect ? "Tato feliz" : "Tato triste"}
                        className="game2-feedback-tato-image"
                    />
                </div>

                {/* Continue button */}
                <div className="game2-feedback-button-container">
                    <IonButton
                        fill="clear"
                        className="game2-check-button-feedback"
                        onClick={onContinue}
                    >
                        <img
                            src={imgSiguiente}
                            alt="Continuar"
                            className="game2-check-button-feedback-image"
                        />
                    </IonButton>
                </div>
            </div>
        </>
    );
};

export default FeedbackScreen;
