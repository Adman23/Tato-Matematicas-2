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
}

/**
 * Functional Summary:
 * Exit confirmation screen component displayed as a modal overlay.
 * 
 * Presents the user with a confirmation dialog when attempting to exit a game,
 * featuring a sad Tato character image and two action buttons for confirming
 * or canceling the exit action.
 * 
 * Execution Flow:
 * 1. Renders a full-screen overlay with a centered card
 * 2. Displays confirmation message and sad Tato image
 * 3. Shows two buttons: confirm (checkmark) and cancel (X)
 * 4. Calls appropriate callback based on user selection
 * 
 * @param {ExitScreenProps} props - Component props
 * @param {() => void} props.confirmExit - Handler for confirming exit
 * @param {() => void} props.cancelExit - Handler for canceling exit
 * @returns {JSX.Element} Modal overlay with exit confirmation dialog
 * 
 * @example
 * // Usage in a game component
 * const [showExitScreen, setShowExitScreen] = useState(false);
 * 
 * {showExitScreen && (
 *   <ExitScreen
 *     confirmExit={() => router.push('/dashboard')}
 *     cancelExit={() => setShowExitScreen(false)}
 *   />
 * )}
 */
const ExitScreen: React.FC<ExitScreenProps> = ({ confirmExit, cancelExit }) => {
    return (
        <div className="game-header-exit-overlay" aria-label="Confirmar salida">
            <div className="game-header-exit-card">
                <p className="game-header-exit-text">¿Seguro que quieres salir?</p>
                <div className="feedback-tato">
                    <img
                        src={"/assets/Tato/TatoTriste.png"}
                        alt={"Tato triste"}
                        className="feedback-tato-image"
                    />
                </div>

                <div className="game-header-exit-actions">
                    <Button3Dtext className="exit-btn" onClick={confirmExit} aria-label="Sí, salir">
                        <img src={iconCorrect} alt="Confirmar" />
                    </Button3Dtext>

                    <Button3Dtext className="exit-btn" onClick={cancelExit} aria-label="No, continuar">
                        <img src={iconIncorrect} alt="Cancelar" />
                    </Button3Dtext>
                </div>
            </div>
        </div>
    );
};

export default ExitScreen;