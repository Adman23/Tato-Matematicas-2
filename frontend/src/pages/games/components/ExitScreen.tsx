/**
 * Exit Screen: A modal overlay component prompting users to confirm exiting a game.
 * 
 * Functional Summary:
 * This component renders a full-screen overlay that asks the user to confirm
 * 
 */

import React from 'react';
import './ExitScreen.css';
import iconCorrect from '/assets/juegosImg/correct.png';
import iconIncorrect from '/assets/juegosImg/incorrecto.png';
import { Button3Dtext } from '../../global_components/PushableButtons';

/**
 * Props interface for the ExitScreen component.
 * 
 * @interface ExitScreenProps
 * @property {() => void} confirmExit - Callback function executed when user confirms exit
 * @property {() => void} cancelExit - Callback function executed when user cancels exit
 */
interface ExitScreenProps {
    confirmExit: () => void;
    cancelExit: () => void;
    enableHoverMode?: boolean;
}

const ExitScreen: React.FC<ExitScreenProps> = ({ confirmExit, cancelExit, enableHoverMode = false }) => {
    return (
        <div className="game-header-exit-overlay" role="dialog" aria-labelledby="exit-title">
            <div className="game-header-exit-card">
                <p id="exit-title" className="game-header-exit-text">¿Seguro que quieres salir?</p>
                <div className="feedback-tato">
                    <img
                        src={"/assets/Tato/TatoTriste.png"}
                        alt={"Tato triste"}
                        className="feedback-tato-image"
                    />
                </div>

                <div className="game-header-exit-actions">
                    <Button3Dtext
                        className="exit-btn"
                        onClick={confirmExit}
                        onMouseEnter={enableHoverMode ? confirmExit : undefined}
                        aria-label="Sí, salir"
                    >
                        <img src={iconCorrect} alt="Confirmar" />
                    </Button3Dtext>

                    <Button3Dtext
                        className="exit-btn"
                        onClick={cancelExit}
                        onMouseEnter={enableHoverMode ? cancelExit : undefined}
                        aria-label="No, continuar"
                    >
                        <img src={iconIncorrect} alt="Cancelar" />
                    </Button3Dtext>
                </div>
            </div>
        </div>
    );
};

export default ExitScreen;
