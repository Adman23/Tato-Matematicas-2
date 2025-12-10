/**
 * DropZone - Order Sequence Drop Area Component (Game 2)
 *
 * Container component that renders all slots (DroppableSlot) where the user must
 * place numbers in the correct order. This is the main drop target area for the
 * Order Sequence game.
 *
 * Functional Summary:
 * - Renders a fixed number of droppable slots based on game configuration
 * - Calculates visual feedback (correct/incorrect) for each occupied slot
 * - Manages locked slots (pre-placed helper numbers)
 * - Supports multiple interaction modes: drag & drop, click, hover
 * - Maintains fixed slot positions to prevent visual reordering
 *
 * Key Features:
 * - **Fixed Positions**: Uses Array.from to create stable slot array
 * - **Locked Indices**: Tracks pre-placed helper numbers (Set<number>)
 * - **Dynamic Feedback**: Compares placed numbers with correct order
 * - **Drop Target**: Identifies first empty slot for drag operations
 * - **Accessibility**: Supports keyboard navigation and multiple input methods
 *
 * Interaction Modes:
 * 1. **Drag & Drop**: Traditional drag and drop (default)
 * 2. **Click Placement**: Click number then click slot
 * 3. **Hover Placement**: Hover over slot to place number
 *
 * CSS Classes Applied (Game2.css):
 * - `.drop-zone-section-v2`: Main container section
 * - `.drop-zone-v2`: Drop zone with flex layout, gap, padding, and shadow
 *
 * @returns {JSX.Element} Drop zone with array of droppable slots
 *
 * @example
 * // Basic usage with 5 slots, some numbers placed
 * <DropZone
 *   numbers={[3, undefined, 7, 1, undefined]}
 *   correctOrder={[1, 3, 5, 7, 9]}
 *   showFeedback={false}
 *   totalSlots={5}
 *   usePictogram={false}
 *   lockedIndices={new Set([2])}  // index 2 is locked
 * />
 *
 * @example
 * // With feedback enabled after checking
 * <DropZone
 *   numbers={[1, 3, 5, 7, 9]}
 *   correctOrder={[1, 3, 5, 7, 9]}
 *   showFeedback={true}
 *   totalSlots={5}
 * />
 */

import React from 'react';
import DroppableSlot from './DroppableSlot';
import './DropZone.css';

/**
 * Props del componente DropZone.
 *
 * @interface DropZoneProps
 * @property {(number | undefined)[]} numbers - Array con números colocados (undefined = slot vacío)
 * @property {number[]} correctOrder - Array con el orden correcto esperado
 * @property {boolean} showFeedback - Si se debe mostrar feedback visual (✓/✗)
 * @property {number} totalSlots - Número total de slots a renderizar
 * @property {boolean} [usePictogram] - Si usar pictogramas en vez de números (rango 0-10)
 * @property {Set<number>} [lockedIndices] - Set de índices bloqueados (números de ayuda)
 * @property {(e: React.DragEvent) => void} [onDragOver] - Callback para drag over
 * @property {(e: React.DragEvent, targetIndex: number) => void} [onDrop] - Callback para drop
 * @property {'correct' | 'incorrect' | null} [feedbackType] - Tipo de feedback a mostrar
 */
interface DropZoneProps {
  numbers: (number | undefined)[];
  correctOrder: number[];
  showFeedback: boolean;
  totalSlots: number;
  usePictogram?: boolean;
  lockedIndices?: Set<number>;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetIndex: number) => void;
  feedbackType?: 'correct' | 'incorrect' | null;
  onSlotClick?: (targetIndex: number) => void;
  onSlotKeyDown?: (e: React.KeyboardEvent, targetIndex: number) => void;
  enableClickPlacement?: boolean;
  onSlotHover?: (targetIndex: number) => void;
  enableHoverPlacement?: boolean;
}

/**
 * Functional Summary:
 * DropZone component - Container for number ordering slots.
 *
 * Execution Flow:
 * 1. Calculates first empty slot index (firstEmptyIndex) for drop target
 * 2. Creates array of `totalSlots` elements using Array.from for fixed positions
 * 3. For each slot index:
 *    a. Retrieves number at that position (numbers[index])
 *    b. Checks if index is locked (pre-placed helper number)
 *    c. Calculates feedback if `showFeedback = true`:
 *       - isCorrect: number matches correctOrder[index]
 *       - isIncorrect: number doesn't match correctOrder[index]
 *    d. Determines if this slot is the drop target (first empty slot)
 * 4. Renders DroppableSlot with all calculated props
 * 5. Returns container div with all slots in fixed positions
 *
 * Feedback Logic:
 * - Only applied when `showFeedback = true` (after user checks answer)
 * - Only for occupied slots (number !== undefined)
 * - Compares `numbers[index]` with `correctOrder[index]`
 * - Visual indicators: green checkmark (correct), red X (incorrect)
 *
 * Drop Target Logic:
 * - First empty slot (undefined) receives `isDropTarget = true`
 * - Enables visual highlighting for drag operations
 * - Prevents dropping in non-target slots
 *
 * @param {DropZoneProps} props - Component properties (see DropZoneProps interface)
 * @returns {JSX.Element} Ordering zone with all droppable slots
 *
 * @example
 * // Zone with 5 slots, partially filled
 * <DropZone
 *   numbers={[3, undefined, 7, 1, undefined]}
 *   correctOrder={[1, 3, 5, 7, 9]}
 *   showFeedback={false}
 *   totalSlots={5}
 *   usePictogram={false}
 *   lockedIndices={new Set([2])}  // index 2 locked
 * />
 *
 * @example
 * // Zone with feedback showing correct/incorrect
 * <DropZone
 *   numbers={[1, 3, 5, 7, 9]}
 *   correctOrder={[1, 3, 5, 7, 9]}
 *   showFeedback={true}
 *   totalSlots={5}
 * />
 */
const DropZone: React.FC<DropZoneProps> = ({
  numbers,
  correctOrder,
  showFeedback,
  totalSlots,
  usePictogram = false,
  lockedIndices = new Set(),
  onDragOver,
  onDrop,
  feedbackType = null,
  onSlotClick,
  onSlotKeyDown,
  enableClickPlacement = false,
  onSlotHover,
  enableHoverPlacement = false
}) => {
  // Calcular el primer índice vacío UNA SOLA VEZ, fuera del loop
  const firstEmptyIndex = numbers.findIndex(n => n === undefined);

  // Crear array de slots con posiciones fijas (evita reordenamiento visual)
  const slots = Array.from({ length: totalSlots }, (_, index) => {
    const num = numbers[index];
    const slotId = `slot-${index}`;
    const isLocked = lockedIndices.has(index);

    // Calcular feedback para este slot
    let isCorrect = false;
    let isIncorrect = false;

    if (showFeedback && num !== undefined) {
      isCorrect = num === correctOrder[index];
      isIncorrect = num !== correctOrder[index];
    }

    // Verificar si este slot es el primero vacío (el que acepta el drop)
    const isDropTarget = index === firstEmptyIndex;

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
        isDropTarget={isDropTarget}
        onDragOver={onDragOver}
        onDrop={onDrop}
        feedbackType={feedbackType}
        onClickSlot={onSlotClick}
        onKeyDownSlot={onSlotKeyDown}
        enableClickPlacement={enableClickPlacement}
        onHoverSlot={onSlotHover}
        enableHoverPlacement={enableHoverPlacement}
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
