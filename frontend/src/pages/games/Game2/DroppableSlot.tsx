/**
 * DroppableSlot - Espacio individual donde se puede soltar un número
 * ------------------------------------------------------------------
 * Componente que representa una posición individual en la zona de ordenamiento del Juego 2.
 * Puede estar vacío (círculo gris con borde discontinuo) o contener un número.
 *
 * Utiliza:
 * - **HTML5 Drag & Drop API** para permitir arrastrar y soltar números.
 * - **Custom Events** para comunicar los drops al componente padre (Game2).
 * - **Ionic Icons** para mostrar feedback visual (✓ correcto, ✗ incorrecto).
 * - Pictogramas locales para números del 0-10 cuando `usePictogram = true`.
 *
 * Estilos aplicados (Game2.css):
 * - `.droppable-slot`: Contenedor del slot (90x90px)
 * - `.empty-slot`: Círculo gris vacío con borde discontinuo
 * - `.number-card-v2`: Círculo azul con número o pictograma
 * - `.number-card-locked`: Números verdes bloqueados (ayuda pre-colocada)
 * - `.feedback-icon`: Iconos de correcto/incorrecto con animación
 */

import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';
import './Game2.css';

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
 */
interface DroppableSlotProps {
  id: string;
  index: number;
  number?: number;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  usePictogram?: boolean;
  isLocked?: boolean;
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
  isLocked = false
}) => {
  // Estado local para efecto visual de hover durante el drag
  const [isDragOver, setIsDragOver] = React.useState(false);

  // Clase CSS del slot (añade hover si se está arrastrando sobre él)
  let slotClass = 'droppable-slot';
  if (isDragOver) slotClass += ' droppable-slot-hover';

  // Obtener imagen del pictograma si aplica (solo números 0-10)
  const pictogramImg = usePictogram && number !== undefined && number <= 10 ? PICTOGRAM_IMAGES[number] : null;

  // Clases CSS de la tarjeta de número
  let cardClass = 'number-card-v2';
  if (usePictogram) cardClass += ' number-card-pictogram';
  if (isLocked) cardClass += ' number-card-locked';

  return (
    <div
      className={slotClass}
      onDragOver={(e) => {
        // No permitir drop en slots bloqueados
        if (isLocked) return;
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        // No permitir drop en slots bloqueados
        if (isLocked) return;
        e.preventDefault();
        setIsDragOver(false);
        const numberStr = e.dataTransfer.getData('number');
        const sourceType = e.dataTransfer.getData('sourceType');

        if (numberStr !== '') {
          const droppedNumber = parseInt(numberStr);
          // Disparar evento personalizado para manejar el drop
          window.dispatchEvent(new CustomEvent('number-dropped', {
            detail: {
              number: droppedNumber,
              targetIndex: index,
              sourceType: sourceType || 'available'
            }
          }));
        }
      }}
    >
      {number !== undefined ? (
        <div
          className={cardClass}
          draggable={!isLocked}
          onDragStart={(e) => {
            if (isLocked) {
              e.preventDefault();
              return;
            }
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('number', number.toString());
            e.dataTransfer.setData('sourceType', 'ordered');
          }}
        >
          {pictogramImg ? (
            <img
              src={pictogramImg}
              alt={`Pictograma número ${number}`}
              className="pictogram-image"
            />
          ) : (
            <span className="number-value">{number}</span>
          )}

          {isCorrect && (
            <IonIcon icon={checkmarkCircle} className="feedback-icon feedback-correct" />
          )}
          {isIncorrect && (
            <IonIcon icon={closeCircle} className="feedback-icon feedback-incorrect" />
          )}
        </div>
      ) : (
        <div className="empty-slot" />
      )}
    </div>
  );
};

export default DroppableSlot;
