/**
 * Functional Summary.
 *
 * Visual component representing a selectable bubble with a number or pictogram.
 *
 * Execution flow.
 * - Renders a button with an accessible role.
 * - If `usePictogram` is active and the value is between 0 and 10, it shows an image.
 * - Manages interaction via click and keyboard (Enter/Space) and responds to states
 *   of `isSelected`, `disabled`, and `isHinted`.
 *
 * @example Usage example
 * <Bubble value={3} usePictogram onClick={(v) => console.log(v)} />
 */

import React from 'react';
import './Bubble.css';

/**
 * Props for the `Bubble` component.
 *
 * @param value - Numeric value displayed in the bubble.
 * @param usePictogram - If true, and `value` is between 0 and 10, a pictogram will be shown.
 * @param isSelected - Visually indicates if the bubble is selected.
 * @param disabled - If true, the bubble is not interactive or focusable.
 * @param isHinted - Indicates that the bubble is shown as a hint (disabled/dimmed).
 * @param onClick - Callback invoked with the value when the user activates the bubble.
 *
 * @returns Props object used by the `Bubble` component.
 *
 * @example
 * const props: Props = { value: 2, usePictogram: true, onClick: v => console.log(v) }
 */
type Props = {
    className?: string;
    value: number;
    usePictogram?: boolean;
    isSelected?: boolean;
    disabled?: boolean;
    isHinted?: boolean;
    onClick?: (value: number) => void;
};

/**
 * `Bubble` component.
 *
 * Renders a circular option that can display a number or a pictogram.
 * Handles accessibility (role, aria-pressed, keyboard handling) and visual
 * states (`selected`, `hinted`, `disabled`).
 *
 * @param props - Props of the {@link Props} component.
 * @returns React element representing the bubble.
 *
 * @example
 * <Bubble value={5} usePictogram onClick={(v) => alert(v)} />
 */
const Bubble: React.FC<Props> = ({
    value,
    className = '',
    usePictogram = true,
    isSelected = false,
    disabled = false,
    isHinted = false,
    onClick
}) => {
    // Determine if we should show a pictogram for this value
    const pictogramSrc = usePictogram && value >= 0 && value <= 10 ? `/assets/numbers/${value}.png` : null;

    let classes = 'nm-number-circle';
    if (pictogramSrc) classes += ' nm-number-card-pictogram';
    if (isSelected) classes += ' selected';
    if (isHinted) classes += ' hinted';
    if (disabled) classes += ' disabled';

    /** Handle activation from mouse or keyboard. */
    const handleClick = () => {
        if (disabled || isHinted) return;
        if (onClick) onClick(value);
    };

    return (
        <div className="nm-number-wrapper">
            <button
                type="button"
                className={`${classes} ${className}`}
                onClick={handleClick}
                aria-label={`Número ${value}${isSelected ? ', seleccionado' : ', no seleccionado'}`}
                aria-disabled={disabled || isHinted}
                disabled={disabled || isHinted}
            >
                {pictogramSrc ? (
                    <img src={pictogramSrc} alt="" aria-hidden="true" className="nm-pictogram-image" />
                ) : (
                    <span className="nm-number-value" aria-hidden="true">{value}</span>
                )}
            </button>
        </div>
    );
};

export default Bubble;
