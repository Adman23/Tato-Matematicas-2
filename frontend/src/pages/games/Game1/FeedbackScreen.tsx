/**
 * FeedbackScreen Component
 * 
 * Displays a full-screen feedback after the user checks their answer.
 * Shows Tato happy/sad and a button to continue or retry.
 */

import React, { useEffect, useRef } from 'react';
import {
    IonContent,
    IonPage,
    IonButton
} from '@ionic/react';
import GameHeader from '../GameHeader';
import './FeedbackScreen.css';

interface FeedbackScreenProps {
    isCorrect: boolean;
    currentRound: number;
    totalRounds: number;
    imgTatoFeliz: string;
    imgTatoTriste: string;
    imgSiguiente: string;
    imgSonido: string;
    imgFlecha: string;
    imgJuego: string;
    imgRepetir?: string;
    onNext: () => void;
    onHomeClick: () => void;
    onRepeat?: () => void;
}

/**
 * FeedbackScreen component that shows the result of the answer.
 * 
 * @param isCorrect - Whether the answer was correct
 * @param currentRound - Current round number
 * @param totalRounds - Total number of rounds
 * @param imgTatoFeliz - Image path for happy Tato
 * @param imgTatoTriste - Image path for sad Tato
 * @param imgSiguiente - Image path for next button
 * @param imgSonido - Image path for sound pictogram
 * @param imgFlecha - Image path for arrow pictogram
 * @param imgJuego - Image path for game pictogram
 * @param onNext - Callback when next button is clicked
 * @param onHomeClick - Callback when home button is clicked
 */
const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
    isCorrect,
    currentRound,
    totalRounds,
    imgTatoFeliz,
    imgTatoTriste,
    imgSiguiente,
    imgSonido,
    imgFlecha,
    imgJuego,
    imgRepetir,
    onNext,
    onHomeClick
    ,
    onRepeat
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Play correct or incorrect sound when component mounts
    useEffect(() => {
        const soundPath = isCorrect ? '/assets/sounds/correct.mp3' : '/assets/sounds/incorrect.mp3';

        // Create and play audio
        const audio = new Audio(soundPath);
        audioRef.current = audio;

        audio.play().catch((err) => {
            console.error('Error playing feedback sound:', err);
        });

        // Cleanup function to stop audio when component unmounts
        return () => {
            if (audioRef.current) {
                try {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioRef.current = null;
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, [isCorrect]);

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
                                className="game1-check-button"
                                onClick={onRepeat}
                            >
                                {imgRepetir ? (
                                    <img
                                        src={imgRepetir}
                                        alt="Repetir"
                                        className="game1-check-button-image"
                                    />
                                ) : (
                                    <>Repetir</>
                                )}
                            </IonButton>
                        )}

                        <IonButton
                            fill="clear"
                            className="game1-check-button"
                            onClick={onNext}
                        >
                            <img
                                src={imgSiguiente}
                                alt="Siguiente"
                                className="game1-check-button-image"
                            />
                        </IonButton>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default FeedbackScreen;
