import React from 'react';
import './Bubble.css';
import { IonIcon } from '@ionic/react';
import { checkmarkSharp, closeSharp } from 'ionicons/icons';

/**
 * Props for the Bubble component.
 *
 * @remarks
 * A bubble represents a single selectable number option in Game1.
 * It can render either a pictogram (image) or the numeric value as text,
 * and shows optional feedback icons (check / cross) when evaluated.
 *
 * @property value - Numeric value represented by the bubble.
 * @property usePictogram - When true and the value is in the supported pictogram range (0-10),
 *                           the component will render an image from `/assets/numbers/{value}.png`.
 * @property isSelected - Visual state for selection (aria-pressed will reflect this).
 * @property isCorrect - When true, shows the "correct" feedback icon and styles.
 * @property isIncorrect - When true, shows the "incorrect" feedback icon and styles.
 * @property disabled - When true, interaction is blocked and the bubble is not focusable.
 * @property onClick - Callback invoked when the bubble is activated by click or keyboard.
 */
type Props = {
    value: number;
    usePictogram?: boolean;
    isSelected?: boolean;
    isCorrect?: boolean;
    isIncorrect?: boolean;
    disabled?: boolean;
    isHinted?: boolean;
    onClick?: (value: number) => void;
};

/**
 * Bubble component: renders a circular selectable number option.
 *
 * The component is accessible: it uses role="button", responds to Enter/Space
 * and exposes `aria-pressed` to indicate selection state. When `usePictogram` is
 * enabled and `value` is between 0 and 10, a pictogram image is used instead of
 * the numeric label.
 *
 * @example
 * <Bubble value={3} usePictogram onClick={(v) => console.log(v)} />
 *
 * @param props - See {@link Props}
 */
const Bubble: React.FC<Props> = ({
    value,
    usePictogram = true,
    isSelected = false,
    isCorrect = false,
    isIncorrect = false,
    disabled = false,
    isHinted = false,
    onClick
}) => {
    // Determine if we should show a pictogram for this value
    const pictogramSrc = usePictogram && value >= 0 && value <= 10 ? `/assets/numbers/${value}.png` : null;

    let classes = 'nm-number-circle';
    if (pictogramSrc) classes += ' nm-number-card-pictogram';
    if (isSelected) classes += ' selected';
    if (isCorrect) classes += ' correct';
    if (isIncorrect) classes += ' incorrect';
    if (isHinted) classes += ' hinted';
    if (disabled) classes += ' disabled';

    /** Handle activation from mouse or keyboard. */
    const handleClick = () => {
        if (disabled || isHinted) return;
        if (onClick) onClick(value);
    };

    return (
        <div className="nm-number-wrapper">
            <div
                className={classes}
                onClick={handleClick}
                role="button"
                aria-pressed={isSelected}
                aria-disabled={disabled || isHinted}
                tabIndex={disabled || isHinted ? -1 : 0}
                onKeyDown={(e) => {
                    if (disabled || isHinted) return;
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

            {/* Feedback icon below the circle: tick for correct, cross for incorrect */}
            {(isCorrect || isIncorrect) && (
                <div
                    className={`nm-feedback-icon ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}
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
