import React from 'react';
import './Bubble.css';
import { IonIcon } from '@ionic/react';
import { checkmarkSharp, closeSharp } from 'ionicons/icons';

type Props = {
    value: number;
    usePictogram?: boolean;
    isSelected?: boolean;
    isCorrect?: boolean;
    isIncorrect?: boolean;
    disabled?: boolean;
    onClick?: (value: number) => void;
};

const Bubble: React.FC<Props> = ({
    value,
    usePictogram = true,
    isSelected = false,
    isCorrect = false,
    isIncorrect = false,
    disabled = false,
    onClick
}) => {
    // Si se puede usar pictogramas y el valor está entre 0 y 10, construimos la ruta
    const pictogramSrc = usePictogram && value >= 0 && value <= 10 ? `/assets/numbers/${value}.png` : null;

    let classes = 'nm-number-circle';
    if (pictogramSrc) classes += ' nm-number-card-pictogram';
    if (isSelected) classes += ' selected';
    if (isCorrect) classes += ' correct';
    if (isIncorrect) classes += ' incorrect';

    const handleClick = () => {
        if (disabled) return;
        if (onClick) onClick(value);
    };

    return (
        <div className="nm-number-wrapper">
            <div
                className={classes}
                onClick={handleClick}
                role="button"
                aria-pressed={isSelected}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleClick();
                        e.preventDefault();
                    }
                }}
            >
                {pictogramSrc ? (
                    <img src={pictogramSrc} alt={`Pictograma número ${value}`} className="nm-pictogram-image" />
                ) : (
                    <span className="nm-number-value">{value}</span>
                )}
            </div>

            {/* Feedback icon debajo del círculo: tick para correcto, cruz para incorrecto */}
            {(isCorrect || isIncorrect) && (
                <div
                    className={`nm-feedback-icon ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}
                    aria-hidden
                >
                    {isCorrect ? (
                        <IonIcon icon={checkmarkSharp} className="nm-ion-icon" />
                    ) : (
                        <IonIcon icon={closeSharp} className="nm-ion-icon" />
                    )}
                </div>
            )}
        </div>
    );
};

export default Bubble;
