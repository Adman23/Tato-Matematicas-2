import React from 'react';
import { IonGrid, IonRow, IonCol } from '@ionic/react';
import Bubble from './Bubble';
import './BubblesZone.css';

/**
 * Props for the BubblesZone component.
 *
 * @property availableNumbers - Array of numbers (or undefined placeholders) to render as bubbles.
 * @property selectedNumber - Currently selected number or null if none selected.
 * @property setSelectedNumber - Setter to update the selected number state in the parent.
 * @property showFeedback - When true, the zone should render bubbles in feedback mode
 *                          (disabling interactions and showing correct/incorrect states).
 * @property currentNumber - The correct number for the current round; used to mark correct bubble.
 * @property usePictograms - When true, bubbles will attempt to render pictograms for supported values.
 */
type Props = {
    availableNumbers: (number | undefined)[];
    selectedNumber: number | null;
    setSelectedNumber: React.Dispatch<React.SetStateAction<number | null>>;
    showFeedback: boolean;
    currentNumber: number | null;
    // Use plural to match Game1's variable name
    usePictograms?: boolean;
};

/**
 * BubblesZone renders a responsive grid of `Bubble` components.
 *
 * It maps `availableNumbers` to individual bubbles, computes selection and
 * feedback states (correct/incorrect) and forwards user clicks to the parent
 * via `setSelectedNumber` unless `showFeedback` is active.
 *
 * @param props - See {@link Props}
 */
const BubblesZone: React.FC<Props> = ({
    availableNumbers,
    selectedNumber,
    setSelectedNumber,
    showFeedback,
    currentNumber,
    usePictograms
}) => {
    return (
        <IonGrid className="numbers-grid">
            <IonRow className="ion-justify-content-center">
                {availableNumbers.map((num, index) => {
                    if (num === undefined) return null;

                    const isSelected = selectedNumber === num;

                    // Determine if we should show correct/incorrect states
                    const showAsCorrect = showFeedback && num === currentNumber;
                    const showAsIncorrect = showFeedback && selectedNumber !== null && selectedNumber === num && selectedNumber !== currentNumber;

                    return (
                        <IonCol size="4" size-md="3" size-lg="2" key={`available-${num}-${index}`} className="ion-text-center">
                            <Bubble
                                value={num}
                                // Bubble expects `usePictogram` (singular) so pass the boolean here
                                usePictogram={!!usePictograms}
                                isSelected={isSelected}
                                isCorrect={showAsCorrect}
                                isIncorrect={showAsIncorrect}
                                disabled={showFeedback}
                                onClick={(v: number) => {
                                    if (showFeedback) return;
                                    setSelectedNumber(prev => (prev === v ? null : v));
                                }}
                            />
                        </IonCol>
                    );
                })}
            </IonRow>
        </IonGrid>
    );
};

export default BubblesZone;
