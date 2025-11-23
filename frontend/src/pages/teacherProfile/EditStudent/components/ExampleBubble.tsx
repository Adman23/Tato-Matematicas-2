import React from 'react';
import './ExampleBubble.css';
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
const ExampleBubble: React.FC<Props & { className?: string }> = ({
    value,
    isSelected = false,
    isCorrect = false,
    isIncorrect = false,
    className
}) => {
    // Determine if we should show a pictogram for this value

    let classes = 'nmExample-number-circle';
    if (isSelected) classes += ' selected';
    if (isCorrect) classes += ' correct';
    if (isIncorrect) classes += ' incorrect';
    if (className) classes += ` ${className}`;

    return (
        <div className="nmExample-number-wrapper">
            <div
                className={classes}
            >
                <span className="nmExample-number-value">{value}</span>
            </div>

            {/* Feedback icon below the circle: tick for correct, cross for incorrect */}
            {(isCorrect || isIncorrect) && (
                <div
                    className={`nmExample-feedback-icon ${isCorrect ? 'correct' : ''} ${isIncorrect ? 'incorrect' : ''}`}
                    aria-hidden
                >
                    {isCorrect ? (
                        <IonIcon icon={checkmarkSharp} className="nmExample-ion-icon" />
                    ) : (
                        <IonIcon icon={closeSharp} className="nmExample-ion-icon" />
                    )}
                </div>
            )}
        </div>
    );
};

export default ExampleBubble;
