/**
 * DroppableSlot - Individual Drop Target Slot (Game 2)
 *
 * Component representing a single position in the Order Sequence game's drop zone.
 * Can be empty (gray circle with dashed border) or contain a placed number.
 *
 * Functional Summary:
 * - Renders individual droppable slot for number placement
 * - Supports multiple interaction modes (drag, click, hover)
 * - Displays visual feedback for correct/incorrect answers
 * - Shows pictograms for numbers 0-10 when enabled
 * - Manages locked slots (pre-placed helper numbers)
 * - Provides accessibility features (ARIA labels, keyboard navigation)
 *
 * Key Features:
 * - **HTML5 Drag & Drop API**: Traditional drag and drop interaction
 * - **Click Placement**: Alternative input method for accessibility
 * - **Hover Placement**: Automatic placement on hover
 * - **Visual Feedback**: Green checkmark (correct), red X (incorrect)
 * - **Pictogram Support**: Images for numbers 0-10 from `/assets/numbers/`
 * - **Locked State**: Green circles for pre-placed helper numbers
 * - **Accessibility**: ARIA labels, keyboard navigation, screen reader support
 *
 * Visual States:
 * 1. **Empty Slot**: Gray circle with dashed border, accepts drops
 * 2. **Occupied Slot**: Blue circle with number/pictogram, draggable
 * 3. **Locked Slot**: Green circle, cannot be dragged or replaced
 * 4. **Drop Target**: Highlighted when ready to accept drop
 * 5. **With Feedback**: Shows checkmark or X overlay
 *
 * CSS Classes Applied (Game2.css):
 * - `.droppable-slot`: Main slot container (90x90px)
 * - `.droppable-slot-target`: Highlighted drop target
 * - `.empty-slot`: Empty gray circle with dashed border
 * - `.number-card-v2`: Blue circle with number/pictogram
 * - `.number-card-locked`: Green locked number (helper)
 * - `.number-card-pictogram`: Special styling for pictogram mode
 * - `.feedback-icon`: Animated feedback icons (checkmark/X)
 * - `.feedback-correct`: Green checkmark overlay
 * - `.feedback-incorrect`: Red X overlay
 *
 * @returns {JSX.Element} Droppable slot with number or empty state
 *
 * @example
 * // Empty slot accepting drops
 * <DroppableSlot
 *   id="slot-0"
 *   index={0}
 *   number={undefined}
 *   isDropTarget={true}
 * />
 *
 * @example
 * // Occupied slot with number 7, showing correct feedback
 * <DroppableSlot
 *   id="slot-2"
 *   index={2}
 *   number={7}
 *   isCorrect={true}
 * />
 *
 * @example
 * // Locked helper slot with pictogram
 * <DroppableSlot
 *   id="slot-1"
 *   index={1}
 *   number={3}
 *   usePictogram={true}
 *   isLocked={true}
 * />
 */

import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';
import './DroppableSlot.css';

/**
 * Mapeo de números (0-10) a sus imágenes de pictogramas desde assets.
 * Usado cuando el juego se configura con rango 0-10 para aprendizaje visual.
 */
const PICTOGRAM_IMAGES: { [key: number]: string } = {
  0: '/assets/numbers/0.png',
  1: '/assets/numbers/1.png',
  2: '/assets/numbers/2.png',
  3: '/assets/numbers/3.png',
  4: '/assets/numbers/4.png',
  5: '/assets/numbers/5.png',
  6: '/assets/numbers/6.png',
  7: '/assets/numbers/7.png',
  8: '/assets/numbers/8.png',
  9: '/assets/numbers/9.png',
  10: '/assets/numbers/10.png'
};

/**
 * Props del componente DroppableSlot.
 *
 * @interface DroppableSlotProps
 * @property {string} id - Identificador único del slot (ej: "slot-0", "slot-1")
 * @property {number} index - Índice de posición en el array de ordenamiento (0-based)
 * @property {number} [number] - Número contenido en el slot (undefined si está vacío)
 * @property {boolean} [isCorrect] - Si el número en este slot es correcto (feedback verde)
 * @property {boolean} [isIncorrect] - Si el número en este slot es incorrecto (feedback rojo)
 * @property {boolean} [usePictogram] - Si se debe mostrar pictograma en vez de número
 * @property {boolean} [isLocked] - Si el número está bloqueado (ayuda pre-colocada, no arrastrable)
 * @property {boolean} [isDropTarget] - Si este slot es el objetivo actual de drop
 * @property {(e: React.DragEvent) => void} [onDragOver] - Callback para drag over
 * @property {(e: React.DragEvent, targetIndex: number) => void} [onDrop] - Callback para drop
 * @property {'correct' | 'incorrect' | null} [feedbackType] - Tipo de feedback a mostrar
 */
interface DroppableSlotProps {
  id: string;
  index: number;
  number?: number;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  usePictogram?: boolean;
  isLocked?: boolean;
  isDropTarget?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetIndex: number) => void;
  feedbackType?: 'correct' | 'incorrect' | null;
  onClickSlot?: (targetIndex: number) => void;
  onKeyDownSlot?: (e: React.KeyboardEvent, targetIndex: number) => void;
  enableClickPlacement?: boolean;
  onHoverSlot?: (targetIndex: number) => void;
  enableHoverPlacement?: boolean;
}

/**
 * Componente DroppableSlot - Posición individual droppable en la zona de ordenamiento.
 *
 * Comportamiento:
 * - **Slot vacío**: Muestra círculo gris con borde discontinuo, acepta drops
 * - **Slot con número**: Muestra círculo azul con número/pictograma, es draggable
 * - **Slot bloqueado**: Círculo verde, no se puede arrastrar ni soltar sobre él
 * - **Feedback**: Muestra ✓ o ✗ sobre el número cuando `showFeedback = true`
 *
 * Drag & Drop:
 * - `onDragOver`: Previene comportamiento por defecto y aplica estilo hover
 * - `onDrop`: Captura el número soltado y dispara evento 'number-dropped'
 * - `onDragStart`: Establece datos del número arrastrado (number, sourceType)
 *
 * Custom Event dispatched:
 * ```javascript
 * window.dispatchEvent(new CustomEvent('number-dropped', {
 *   detail: {
 *     number: 5,              // Número soltado
 *     targetIndex: 2,         // Índice de destino
 *     sourceType: 'ordered'   // Origen: 'available' o 'ordered'
 *   }
 * }));
 * ```
 *
 * @param props - Propiedades del componente (ver DroppableSlotProps)
 * @returns Slot droppable con número o vacío
 *
 * @example
 * // Slot vacío (acepta drops)
 * <DroppableSlot id="slot-0" index={0} number={undefined} />
 *
 * @example
 * // Slot con número 7, feedback correcto
 * <DroppableSlot
 *   id="slot-2"
 *   index={2}
 *   number={7}
 *   isCorrect={true}
 * />
 *
 * @example
 * // Slot bloqueado (ayuda) con pictograma del 3
 * <DroppableSlot
 *   id="slot-1"
 *   index={1}
 *   number={3}
 *   usePictogram={true}
 *   isLocked={true}
 * />
 */
const DroppableSlot: React.FC<DroppableSlotProps> = ({
  index,
  number,
  isCorrect = false,
  isIncorrect = false,
  usePictogram = false,
  isLocked = false,
  isDropTarget = false,
  onDragOver,
  onDrop,
  feedbackType = null,
  onClickSlot,
  onKeyDownSlot,
  enableClickPlacement = false,
  onHoverSlot,
  enableHoverPlacement = false
}) => {
  // Clase CSS del slot
  let slotClass = 'droppable-slot';
  if (isDropTarget && number === undefined) slotClass += ' droppable-slot-target';

  // Obtener imagen del pictograma si aplica (solo números 0-10)
  // Verificar explícitamente el rango completo incluyendo el 0
  const pictogramImg = usePictogram && number !== undefined && number >= 0 && number <= 10 ? PICTOGRAM_IMAGES[number] : null;

  // Clases CSS de la tarjeta de número
  let cardClass = 'number-card-v2';
  if (usePictogram) cardClass += ' number-card-pictogram';
  if (isLocked) cardClass += ' number-card-locked';

  // Determinar el label para el slot
  const isEmpty = number === undefined;
  const slotLabel = isEmpty
    ? `Posición ${index + 1}, vacía`
    : `Posición ${index + 1}, número ${number}${isLocked ? ', bloqueado' : ''}`;

  return (
    <div
      className={slotClass}
      onDragOver={(e) => {
        if (isDropTarget) {
          onDragOver?.(e);
        }
      }}
      onDrop={(e) => {
        if (isDropTarget) {
          onDrop?.(e, index);
        }
      }}
      onClick={() => {
        if (enableClickPlacement && isDropTarget) {
          onClickSlot?.(index);
        }
      }}
      onKeyDown={(e) => {
        if (enableClickPlacement && isDropTarget) {
          onKeyDownSlot?.(e, index);
        }
      }}
      onMouseEnter={() => {
        if (enableHoverPlacement && isDropTarget) {
          onHoverSlot?.(index);
        }
      }}
      tabIndex={enableClickPlacement && isDropTarget ? 0 : -1}
      role={enableClickPlacement && isDropTarget ? "button" : undefined}
      aria-label={enableClickPlacement && isDropTarget ? `Colocar número en ${slotLabel}` : slotLabel}
      aria-live={isDropTarget ? "polite" : undefined}
    >
      {number !== undefined ? (
        <div className={cardClass} aria-hidden="true">
          {pictogramImg ? (
            <img
              src={pictogramImg}
              alt=""
              className="pictogram-image"
              loading="eager"
              decoding="sync"
              draggable="false"
            />
          ) : (
            <span className="number-value">{number}</span>
          )}

          {isCorrect && (
            <IonIcon icon={checkmarkCircle} className="feedback-icon feedback-correct" aria-label="Correcto" />
          )}
          {isIncorrect && (
            <IonIcon icon={closeCircle} className="feedback-icon feedback-incorrect" aria-label="Incorrecto" />
          )}
        </div>
      ) : (
        <div className="empty-slot" aria-hidden="true">
          {feedbackType === 'incorrect' && isDropTarget && (
            <IonIcon icon={closeCircle} className="feedback-icon feedback-incorrect-slot" aria-label="Incorrecto" />
          )}
        </div>
      )}
    </div>
  );
};

export default DroppableSlot;
