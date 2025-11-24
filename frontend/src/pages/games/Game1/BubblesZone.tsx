/**
 * Functional Summary.
 *
 * Renders a collection (grid) of selectable number bubbles
 * used in the game. It is responsible for mapping `availableNumbers` to `Bubble`s,
 * marking the current selection, and propagating interaction to the parent component.
 *
 * Execution flow.
 * - Receives a list of numbers (or `undefined` as placeholder) and transforms it
 *   into a grid of `Bubble` components.
 * - If `showFeedback` is true, disables interaction.
 * - Marks bubbles that have been used as hints via `hintsUsed`.
 *
 * @example
 * <BubblesZone availableNumbers={[1,2,3]} selectedNumber={2} setSelectedNumber={...} showFeedback={false} currentNumber={2} />
 */

import React from 'react';
import Bubble from './Bubble';
import './BubblesZone.css';


/**
 * Props for `BubblesZone`.
 *
 * @param availableNumbers - Array of numbers (or `undefined` as placeholders).
 * @param selectedNumber - Currently selected number or `null` if none selected.
 * @param setSelectedNumber - Setter to update the selection in the parent component.
 * @param showFeedback - If true, the zone is in feedback mode and bubbles are disabled.
 * @param currentNumber - The correct number for the current round (can be `null`).
 * @param usePictograms - If true, bubbles will attempt to show pictograms for 0-10.
 * @param hintsUsed - List of numbers that have been marked as hints (non-interactive).
 *
 * @returns Props used by the `BubblesZone` component.
 */
type Props = {
    availableNumbers: (number | undefined)[];
    selectedNumber: number | null;
    setSelectedNumber: React.Dispatch<React.SetStateAction<number | null>>;
    showFeedback: boolean;
    currentNumber: number | null;
    usePictograms?: boolean;
    hintsUsed?: number[];
};

/**
 * `BubblesZone` component.
 *
 * Render a grid of `Bubble`s and manage local selection and hint state.
 * Does not mutate data: uses `setSelectedNumber` to notify changes to the parent component.
 *
 * @param props - Props of the {@link Props} component.
 * @returns React element containing the bubble grid.
 */
const BubblesZone: React.FC<Props> = ({
    availableNumbers,
    selectedNumber,
    setSelectedNumber,
    showFeedback,
    usePictograms,
    hintsUsed = []
}) => {
    return (
        <div className="numbers-grid">
            {availableNumbers.map((num, index) => {
                if (num === undefined) return null;

                const isSelected = selectedNumber === num;
                const isHinted = hintsUsed.includes(num);

                return (
                    <Bubble
                        key={`available-${num}-${index}`}
                        value={num}
                        usePictogram={usePictograms}
                        isSelected={isSelected}
                        isHinted={isHinted}
                        disabled={showFeedback}
                        onClick={(v: number) => {
                            setSelectedNumber(prev => (prev === v ? null : v));
                        }}
                    />
                );
            })}
        </div>
    );
};

export default BubblesZone;
