/**
 * DropZone - Zona donde el usuario ordena los números
 */

import React from 'react';
import DroppableSlot from './DroppableSlot';
import './Game2.css';

interface DropZoneProps {
  numbers: (number | undefined)[];
  correctOrder: number[];
  showFeedback: boolean;
  totalSlots: number;
  usePictogram?: boolean;
  lockedIndices?: Set<number>;
}

const DropZone: React.FC<DropZoneProps> = ({
  numbers,
  correctOrder,
  showFeedback,
  totalSlots,
  usePictogram = false,
  lockedIndices = new Set()
}) => {
  // Crear array de slots con posiciones fijas
  const slots = Array.from({ length: totalSlots }, (_, index) => {
    const num = numbers[index];
    const slotId = `slot-${index}`;
    const isLocked = lockedIndices.has(index);

    let isCorrect = false;
    let isIncorrect = false;

    if (showFeedback && num !== undefined) {
      isCorrect = num === correctOrder[index];
      isIncorrect = num !== correctOrder[index];
    }

    return (
      <DroppableSlot
        key={slotId}
        id={slotId}
        index={index}
        number={num}
        isCorrect={isCorrect}
        isIncorrect={isIncorrect}
        usePictogram={usePictogram}
        isLocked={isLocked}
      />
    );
  });

  return (
    <div className="drop-zone-section-v2">
      <div className="drop-zone-v2">
        {slots}
      </div>
    </div>
  );
};

export default DropZone;
