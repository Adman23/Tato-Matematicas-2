import React, { useRef } from 'react';
import './DraggableNumber.css';
import Bubble from '../Game1/Bubble'; // Reutilizamos Bubble para la UI

interface DraggableNumberProps {
    number: number;
    id: string;
    onDragStart?: (e: React.DragEvent, id: string, number: number) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    isDragging?: boolean;
    isDisabled?: boolean;
}

const DraggableNumber: React.FC<DraggableNumberProps> = ({
    number,
    id,
    onDragStart,
    onDragEnd,
    isDragging = false,
    isDisabled = false,
}) => {
    // Ref para el preview creado en el DOM
    const previewRef = useRef<HTMLElement | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        // Guardar id en dataTransfer para compatibilidad nativa
        try {
            e.dataTransfer.setData('text/plain', id);
        } catch (err) { /* algunos browsers pueden fallar en setData en touch */ }

        e.dataTransfer.effectAllowed = 'move';

        // Crear preview: clonar la burbuja interna para que el "drag image" sea idéntico
        const wrapper = e.currentTarget as HTMLDivElement;
        const bubble = wrapper.querySelector('.nm-number-circle') as HTMLElement | null;

        if (bubble) {
            const rect = bubble.getBoundingClientRect();
            const clone = bubble.cloneNode(true) as HTMLElement;

            // Marcar como preview (para CSS específico)
            clone.classList.add('drag-preview');
            // Asegurar que el preview no interfiera con eventos
            clone.style.pointerEvents = 'none';
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.left = '-9999px';
            clone.style.zIndex = '9999';

            // Ajustar tamaño explícito para que setDragImage funcione consistente
            clone.style.width = `${rect.width}px`;
            clone.style.height = `${rect.height}px`;
            clone.style.display = 'inline-block';

            document.body.appendChild(clone);
            previewRef.current = clone;

            // Centrar el cursor en la bola
            const offsetX = rect.width / 2;
            const offsetY = rect.height / 2;
            try {
                e.dataTransfer.setDragImage(clone, offsetX, offsetY);
            } catch (err) {
                // algunos navegadores (iOS Safari) ignoran setDragImage
            }
        }

        // Ocultar visualmente la burbuja original (mantener layout) y añadir estado dragging al wrapper
        wrapper.classList.add('dragging');
        wrapper.classList.add('dragging-hidden');

        if (onDragStart) onDragStart(e, id, number);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        const wrapper = e.currentTarget as HTMLDivElement;

        // Quitar preview del DOM si existe
        if (previewRef.current && previewRef.current.parentNode) {
            previewRef.current.parentNode.removeChild(previewRef.current);
            previewRef.current = null;
        }

        // Restaurar visibilidad del original
        wrapper.classList.remove('dragging');
        wrapper.classList.remove('dragging-hidden');

        if (onDragEnd) onDragEnd(e);
    };

    // Wrapper mantiene clases previas para estilos actuales
    return (
        <div
            className={`draggable-number ${isDragging ? 'dragging' : ''} ${isDisabled ? 'disabled' : ''}`}
            draggable={!isDisabled}
            onDragStart={isDisabled ? undefined : handleDragStart}
            onDragEnd={isDisabled ? undefined : handleDragEnd}
            // accesibilidad: role y aria
            role={isDisabled ? undefined : 'button'}
            aria-disabled={isDisabled}
        >
            {/* Usamos Bubble para la apariencia, pasándole flags relevantes */}
            <Bubble
                value={number}
                usePictogram={false}
                isSelected={false}
                isHinted={false}
                onClick={() => { /* mantener sin efecto; interacción por drag */ }}
            />
        </div>
    );
};

export default DraggableNumber;
