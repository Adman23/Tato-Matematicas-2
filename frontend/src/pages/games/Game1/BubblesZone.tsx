import React from 'react';
import { IonGrid, IonRow, IonCol } from '@ionic/react';
import Bubble from './Bubble';
import './BubblesZone.css';

type Props = {
    availableNumbers: (number | undefined)[];
    selectedNumber: number | null;
    setSelectedNumber: React.Dispatch<React.SetStateAction<number | null>>;
    showFeedback: boolean;
    currentNumber: number | null;
    // Use plural to match Game1's variable name
    usePictograms?: boolean;
};

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

                    // Determinar estados para feedback
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
