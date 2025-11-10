/**
 * DroppableSlot - Espacio individual donde se puede soltar un número
 */

import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';
import './Game2.css';

// Importar imágenes locales de pictogramas
import img0 from './img/0.png';
import img1 from './img/uno.png';
import img2 from './img/2.png';
import img3 from './img/3.png';
import img4 from './img/4.png';
import img5 from './img/5.png';
import img6 from './img/6.png';
import img7 from './img/7.png';
import img8 from './img/8.png';
import img9 from './img/9.png';
import img10 from './img/10.png';

// Mapeo de números a imágenes locales
const PICTOGRAM_IMAGES: { [key: number]: string } = {
  0: img0,
  1: img1,
  2: img2,
  3: img3,
  4: img4,
  5: img5,
  6: img6,
  7: img7,
  8: img8,
  9: img9,
  10: img10
};

interface DroppableSlotProps {
  id: string;
  index: number;
  number?: number;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  usePictogram?: boolean;
  isLocked?: boolean;
}

const DroppableSlot: React.FC<DroppableSlotProps> = ({
  index,
  number,
  isCorrect = false,
  isIncorrect = false,
  usePictogram = false,
  isLocked = false
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  let slotClass = 'droppable-slot';
  if (isDragOver) slotClass += ' droppable-slot-hover';

  // Obtener imagen local del pictograma
  const pictogramImg = usePictogram && number !== undefined && number <= 10 ? PICTOGRAM_IMAGES[number] : null;

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
