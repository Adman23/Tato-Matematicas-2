import React from 'react';
import './ExitScreen.css';
import iconCorrect from '/assets/juegosImg/correct.png';
import iconIncorrect from '/assets/juegosImg/incorrecto.png';
import { Button3Dtext } from '../../global_components/PushableButtons';

interface ExitScreenProps {
    confirmExit: () => void;
    cancelExit: () => void;
}

const ExitScreen: React.FC<ExitScreenProps> = ({ confirmExit, cancelExit }) => {

    {
        return (
            <div className="game-header-exit-overlay" role="dialog" aria-modal="true" aria-label="Confirmar salida">
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
                </div >
            </div >
        );
    };
};

export default ExitScreen;