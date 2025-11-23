/**
 * DropZone - Zona donde el usuario ordena los números
 * -----------------------------------------------------
 * Componente contenedor que renderiza todos los slots (DroppableSlot) donde
 * el usuario debe colocar los números en el orden correcto.
 *
 * Utiliza:
 * - **DroppableSlot** para cada posición individual
 * - **Array.from** para crear slots con posiciones fijas
 * - **Set<number>** para identificar índices bloqueados (números de ayuda)
 *
 * Responsabilidades:
 * - Renderizar el número correcto de slots según la configuración
 * - Calcular feedback (correcto/incorrecto) para cada slot
 * - Pasar props adecuadas a cada DroppableSlot (número, locked, feedback)
 * - Mantener posiciones fijas para evitar reordenamiento visual
 *
 * Estilos aplicados (Game2.css):
 * - `.drop-zone-section-v2`: Contenedor principal
 * - `.drop-zone-v2`: Zona con display flex, gap, padding y sombra
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
}

/**
 * Componente DropZone - Contenedor de slots para ordenamiento de números.
 *
 * Flujo de renderizado:
 * 1. Crea array de `totalSlots` elementos con Array.from
 * 2. Para cada índice:
 *    - Obtiene el número en esa posición (numbers[index])
 *    - Verifica si es un índice bloqueado (ayuda pre-colocada)
 *    - Calcula feedback si `showFeedback = true`:
 *      - isCorrect: número coincide con correctOrder[index]
 *      - isIncorrect: número no coincide con correctOrder[index]
 * 3. Renderiza DroppableSlot con todas las props calculadas
 *
 * Lógica de feedback:
 * - Solo se aplica cuando `showFeedback = true` (después de check)
 * - Solo para slots con número (no undefined)
 * - Compara `numbers[index]` con `correctOrder[index]`
 *
 * @param props - Propiedades del componente (ver DropZoneProps)
 * @returns Zona de ordenamiento con todos los slots
 *
 * @example
 * // Zona de 5 slots, números [3, undefined, 7, 1, undefined]
 * // Orden correcto [1, 3, 5, 7, 9], sin feedback
 * <DropZone
 *   numbers={[3, undefined, 7, 1, undefined]}
 *   correctOrder={[1, 3, 5, 7, 9]}
 *   showFeedback={false}
 *   totalSlots={5}
 *   usePictogram={false}
 *   lockedIndices={new Set([2])}  // índice 2 bloqueado
 * />
 *
 * @example
 * // Zona con feedback activo mostrando correcto/incorrecto
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
  feedbackType = null
}) => {
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
    const firstEmptyIndex = numbers.findIndex(n => n === undefined);
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
