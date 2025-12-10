/**
 * ContainerBlock Component
 * 
 * This component represents a container for the games 3 and 4.
 * Containers can be of type 'bowl', 'chest', or 'zone'.
 * 
 * It displays numbers inside the container and handles drag-and-drop functionality,
 * between different containers and external drops.
 * 
 * Props:
 * - type: 'bowl' | 'chest' | 'zone' - Type of the container.
 * - numbers: Array of number items to display inside the container. 
 * - roundKey: Optional key to identify the current round (for resetting state).
 * - className: Optional additional CSS class for styling
 */


import React, { useEffect, useRef } from 'react';
import DraggableNumber from './DraggableNumber';
import './ContainerBlock.css';

type ContainerType = 'bowl' | 'chest' | 'zone';


/**
 * @brief Type to introduce in the container numbers.
 * Each number has a unique ID and a numeric value, this is needed for drag-and-drop operations.
 * A map is not enough because we need to preserve the id between changes of containers.
 */
type NumberItem = {
    id: string;
    value: number;
};

/**
 * @brief Props for the ContainerBlock component.
 * 
 * @param type - Type of the container: 'bowl', 'chest', or 'zone'.
 * @param numbers - Array of number items contained in this container.
 * @param roundKey - Optional key to identify the current round (for resetting state).
 * @param className - Optional additional CSS class for styling
 * 
 * @param onGlobalDragStart - Callback when a number drag starts.
 * @param onGlobalDragEnd - Callback when a number drag ends.
 * @param onExternalDrop - Callback when a number is dropped from outside.
 * @param showDebugZones - If true, shows debug visual zones.
 * 
 */
type Props = { 
    type: ContainerType;
    numbers: NumberItem[];
    roundKey?: string | number;
    className?: string;
    onGlobalDragStart?: (e: React.DragEvent, id: string, value: number) => void;
    onGlobalDragEnd?: (e: React.DragEvent) => void;
    onExternalDrop?: (value: number) => void;
    showDebugZones?: boolean;
};

// To add the container background images
const typeToImage: Record<'bowl' | 'chest', string> = {
    bowl:  '/assets/juegosImg/game34/cuenco.png',
    chest: '/assets/juegosImg/game34/cofre.png',
};


/**
 * @brief ContainerBlock component. 
 * 
 * @param Props - Props for the component. 
 * @returns React element representing the container block.
 */
const ContainerBlock: React.FC<Props> = ({
    type,
    numbers,
    roundKey,
    className = '',
    onGlobalDragStart,
    onGlobalDragEnd,
    onExternalDrop,
    showDebugZones = false,
}) => {
    const isChest = type === 'chest';
    const isZone  = type === 'zone';

    // Helper to compute current total of numbers
    const getCurrentTotal = () => numbers.reduce((acc, item) => acc + item.value, 0);

    // State refs. Refs are preferred here for synchronous updates.
    const initialTotalRef = useRef<number>(getCurrentTotal());   // initial total at round start
    const pastTotalRef = useRef<number>(initialTotalRef.current);// previous total used to compute diffs
    
    // Math expression state (expression shown below the container)
    const mathExpressionRef = useRef<{ operation: string; result: number }>({ operation: '', result: initialTotalRef.current });
    // Track added/removed values
    const addedValuesRef = useRef<number[]>([]);
    const removedValuesRef = useRef<number[]>([]);
    
    // Round key tracker: initialize to 0 to detect first render vs new roundKey
    const lastRoundKeyRef = useRef<string | number | undefined>(0);

    // IDs from previous render for identity comparison
    const prevIdsRef = useRef<Set<string>>(new Set(numbers.map(n => n.id)));

    const [, forceUpdate] = React.useReducer(x => x + 1, 0);

    useEffect(() => {
        const currentTotal = getCurrentTotal();
        const currentIds = new Set(numbers.map(n => n.id));
        const prevIds = prevIdsRef.current;

        // Detect explicit roundKey change
        const isKeyChange = lastRoundKeyRef.current !== roundKey;

        // Detect a wholesale data swap (no IDs in common) or initial load from empty -> many
        let commonIds = 0;
        if (numbers.length > 0 && prevIds.size > 0) {
            numbers.forEach(n => { if (prevIds.has(n.id)) commonIds++; });
        }

        const isDataSwap = (numbers.length > 0 && prevIds.size > 0 && commonIds === 0) ||
                        (prevIds.size === 0 && numbers.length > 1);

        // RESET when roundKey changes or data is swapped
        if (isKeyChange || isDataSwap) { 
            // Update base references
            lastRoundKeyRef.current = roundKey;
            initialTotalRef.current = currentTotal;
            pastTotalRef.current = currentTotal; 
            
            // Clear visual history
            addedValuesRef.current = [];
            removedValuesRef.current = [];
            mathExpressionRef.current = { operation: '', result: currentTotal };
            
            prevIdsRef.current = currentIds;

            forceUpdate();
            return; 
        }

        // ---------------------------------------------------------
        // MATH LOGIC: only runs for real moves (not resets)
        // ---------------------------------------------------------
        
        const diff = currentTotal - pastTotalRef.current;
        pastTotalRef.current = currentTotal;
        prevIdsRef.current = currentIds; // update IDs after computing diff

        if (diff === 0) return;

        if (diff > 0) {
            if (removedValuesRef.current.includes(diff)) {
                const idx = removedValuesRef.current.indexOf(diff);
                if (idx > -1) removedValuesRef.current.splice(idx, 1); // remove first match
            } else {
                addedValuesRef.current.push(diff);
            }
        } else if (diff < 0) {
            const absDiff = Math.abs(diff);
            if (addedValuesRef.current.includes(absDiff)) {
                const idx = addedValuesRef.current.indexOf(absDiff);
                if (idx > -1) addedValuesRef.current.splice(idx, 1); // remove first match
            } else {
                removedValuesRef.current.push(absDiff);
            }
        }

        // If we returned to the initial total, clear added/removed lists
        if (currentTotal === initialTotalRef.current) {
            addedValuesRef.current = [];
            removedValuesRef.current = [];
        }

        getExpression();

    }, [numbers, roundKey]); 

    // compute and set math expression; if result reaches 0 reset to base 0
    const getExpression = () => {
        const added = addedValuesRef.current;
        const removed = removedValuesRef.current;

        const operation = added.length > 0 || removed.length > 0
            ? `${initialTotalRef.current}${added.map(v => ` + ${v}`).join('')}${removed.map(v => ` - ${v}`).join('')}`
            : '';

        const result = initialTotalRef.current
            + added.reduce((a, b) => a + b, 0)
            - removed.reduce((a, b) => a + b, 0);

        // If expression becomes zero, reset base to zero
        if (result === 0) {
            initialTotalRef.current = 0;
            pastTotalRef.current = 0;
            addedValuesRef.current = [];
            removedValuesRef.current = [];
            mathExpressionRef.current = { operation: '', result: 0 };
            forceUpdate();
            return;
        }

        mathExpressionRef.current = { operation, result };
        forceUpdate();
    };
    
    const mathExpression = mathExpressionRef.current;
    const bgImage = isZone ? undefined : typeToImage[type as 'bowl' | 'chest'];
    const bgStyle = bgImage ? { backgroundImage: `url(${bgImage})` } : undefined;

    return (
        
        <div className={`container-block ${className}`}>
            <div
                className={`container-visual ${isZone ? 'container-zone' : 'container-bg'}`}
                style={bgStyle}
                onDragOver={isChest ? undefined : (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={isChest ? undefined : (e) => 
                    { e.preventDefault();   if (onExternalDrop) onExternalDrop(NaN); 
                                            if (onGlobalDragEnd) onGlobalDragEnd(e); }}
            >
                <div className={`container-content ${showDebugZones ? 'debug-visible' : ''}  
                                                ${isZone ? 'container-content-zone' : ''}`}>
                    {numbers.map((item) => (
                        <DraggableNumber
                            key={item.id}
                            id={item.id}
                            number={item.value}
                            onDragStart ={isChest ? undefined : (e) => onGlobalDragStart && onGlobalDragStart(e, item.id, item.value)}
                            onDragEnd   ={isChest ? undefined : (e) => onGlobalDragEnd && onGlobalDragEnd(e)}
                            isDragging  ={false}
                            isDisabled  ={isChest}
                        />
                    ))}
                </div>
            </div>
            {!isZone && <div className="container-total">
                <span className="container-total-text">
                    {mathExpression.operation && (
                        <>
                            <span style={{ opacity: 0.9, fontSize: '1em',  }}>{mathExpression.operation}</span>
                            <span style={{ opacity: 0.9, fontWeight: 900, fontSize: '1.05em', margin: '0 clamp(0.1rem, 0.5vw, 0.3rem)' }}>=</span>
                        </>
                    )}
                    <span style={{ color: 'var(--ion-color-primary)', fontWeight: 900, fontSize: '1.15em' }}>{mathExpression.result}</span>
                </span>
            </div>}
        </div>
        );
};

export default ContainerBlock;