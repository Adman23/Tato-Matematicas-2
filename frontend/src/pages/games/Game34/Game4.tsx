/**
 * Game 4 - Learn to subtract by equalizing containers.
 * 
 * The student must remove numbers from bowls to match the chest total.
 */

import React from 'react';
import BaseGame34 from './baseGame34';
import type { GameConfig } from '../../../lib/api';
import type { NumberItem, Container } from './baseGame34';

const Game4: React.FC = () => {
    const createNumberItem = (value: number): NumberItem => ({
        id: `num-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        value
    });

    /**
     * Genera los datos de una ronda para el Juego 4.
     * Cada solución tiene entre 3 y (object_count/container_count) objetos (mínimo 2 si es menor que 3).
     * Siempre hay que quitar al menos un número, preferiblemente más de uno.
     */
    const generateRoundData = (config: GameConfig): {
        containers: Container[];
        topZone: NumberItem[];
        targetTotal: number;
        solution: { [bowlId: string]: string[] };
    } => {
        const [min, max] = config.number_range.split('-').map(Number);
        const actualMin = Math.max(1, min);

        let containersCount = config.settings?.container_count || 2;
        let objectsCount = config.settings?.object_count || 8;
        if (objectsCount <= containersCount) {
            objectsCount = containersCount + 4;
        } else if (objectsCount <= containersCount + 1) {
            objectsCount = containersCount + 5;
        }

        const targetTotal = generateBiasedRandomInRange(actualMin, max);
        const maxNumberValue = targetTotal - 1;
        if (maxNumberValue < actualMin) {
            const newTarget = Math.max(actualMin + 3, Math.floor((max - actualMin) * 0.7) + actualMin);
            return generateRoundDataWithTarget(config, newTarget, actualMin, max, containersCount, objectsCount);
        }

        const numbersPerBowl = Math.floor(objectsCount / containersCount);
        const extraNumbers = objectsCount % containersCount;

        const bowls: Container[] = [];
        const solution: { [bowlId: string]: string[] } = {};

        const minParts = 3;
        const maxParts = Math.max(3, Math.floor(objectsCount / containersCount));
        const exactlyTwoPerBowl = objectsCount / containersCount === 2;

        for (let i = 0; i < containersCount; i++) {
            let bowlNumberItems: NumberItem[] = [];
            let keepIds: string[] = [];

            if (exactlyTwoPerBowl) {
                // One solution, one to remove
                const solutionValue = targetTotal;
                let removableValue;
                do {
                    removableValue = Math.floor(Math.random() * (maxNumberValue - actualMin + 1)) + actualMin;
                } while (removableValue === solutionValue);

                const solutionItem = createNumberItem(solutionValue);
                const removableItem = createNumberItem(removableValue);
                bowlNumberItems = [solutionItem, removableItem].sort(() => Math.random() - 0.5);
                keepIds = [solutionItem.id];
            } else {
                // To ensure we dont have 4 objects with 4 containers
                if (objectsCount <= containersCount) {
                    objectsCount = containersCount + 4;
                } // To ensure we dont have 4 objects with 3 containers
                else if (objectsCount <= containersCount + 1) {
                    objectsCount = containersCount + 5;
                }

                const countForThisBowl = Math.max(2, numbersPerBowl + (i < extraNumbers ? 1 : 0));
                let solutionParts: number;
                if (countForThisBowl === 2) {
                    solutionParts = 1;
                } else {
                    solutionParts = Math.max(
                        2,
                        Math.min(
                            maxParts,
                            Math.min(countForThisBowl - 1, Math.floor(Math.random() * (maxParts - minParts + 1)) + minParts)
                        )
                    );
                }
                const keepParts = divideNumberIntoParts(
                    targetTotal,
                    solutionParts,
                    solutionParts,
                    actualMin,
                    maxNumberValue
                );
                const removableCount = countForThisBowl - keepParts.length;
                let removableParts: number[] = [];
                if (removableCount > 0) {
                    if (countForThisBowl === 2) {
                        let val;
                        do {
                            val = Math.floor(Math.random() * (maxNumberValue - actualMin + 1)) + actualMin;
                        } while (val === keepParts[0]);
                        removableParts = [val];
                    } else {
                        const minExcess = removableCount * actualMin;
                        const maxExcess = removableCount * maxNumberValue;
                        const excess = Math.max(minExcess, Math.floor(Math.random() * (maxExcess - minExcess + 1)) + minExcess);
                        removableParts = divideNumberIntoParts(
                            excess,
                            removableCount,
                            removableCount,
                            actualMin,
                            maxNumberValue
                        );
                    }
                }
                const allNumbers = [...removableParts, ...keepParts];
                allNumbers.sort(() => Math.random() - 0.5);
                bowlNumberItems = allNumbers.map(createNumberItem);
                keepIds = [];
                let idx = 0;
                let keepPartsCopy = [...keepParts];
                for (const val of allNumbers) {
                    if (keepPartsCopy.includes(val)) {
                        keepIds.push(bowlNumberItems[idx].id);
                        keepPartsCopy.splice(keepPartsCopy.indexOf(val), 1);
                    }
                    idx++;
                }
            }

            bowls.push({
                id: `bowl-${i + 1}`,
                type: 'bowl' as const,
                numbers: bowlNumberItems
            });
            solution[`bowl-${i + 1}`] = keepIds;
        }
        const containers: Container[] = [...bowls];

        return {
            containers,
            topZone: [] as NumberItem[],
            targetTotal,
            solution
        };
    };

    // Divide un número en un número de partes entre minParts y maxParts, cada parte entre min y max
    const divideNumberIntoParts = (
        total: number,
        minParts: number,
        maxParts: number,
        min: number,
        max: number
    ): number[] => {
        if (total <= 0 || minParts > maxParts) return [];
        const parts: number[] = [];
        let remaining = total;
        const partsCount = Math.max(minParts, Math.min(maxParts, Math.floor(Math.random() * (maxParts - minParts + 1)) + minParts));
        for (let i = 0; i < partsCount - 1; i++) {
            const maxPossible = Math.min(max, remaining - (partsCount - i - 1) * min);
            const minPossible = Math.max(min, remaining - (partsCount - i - 1) * max);
            if (minPossible > maxPossible) break;
            const part = Math.floor(Math.random() * (maxPossible - minPossible + 1)) + minPossible;
            parts.push(part);
            remaining -= part;
        }
        if (remaining >= min && remaining <= max) {
            parts.push(remaining);
        }
        return parts;
    };

    const generateBiasedRandomInRange = (min: number, max: number): number => {
        const range = max - min;
        const u1 = Math.random();
        const u2 = Math.random();
        const normalRandom = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const biasedValue = 0.7 + (normalRandom * 0.15);
        const clampedValue = Math.max(0, Math.min(1, biasedValue));
        const result = Math.round(min + (clampedValue * range));
        return Math.max(min, Math.min(max, result));
    };

    // Si usas generateRoundDataWithTarget, asegúrate de que también devuelva 'solution'
    const generateRoundDataWithTarget = (
        config: GameConfig,
        target: number,
        actualMin: number,
        max: number,
        containersCount: number,
        objectsCount: number
    ): {
        containers: Container[];
        topZone: NumberItem[];
        targetTotal: number;
        solution: { [bowlId: string]: string[] };
    } => {
        // ...igual que arriba, puedes reutilizar el mismo algoritmo...
        return generateRoundData({
            ...config,
            settings: {
                ...config.settings,
                container_count: containersCount,
                object_count: objectsCount
            },
            number_range: `${actualMin}-${max}`
        });
    };

    // Hint: move a removable number (not in solution) to the top zone (only one per hint)
    const useHint = (
        gameState: {
            containers: Container[],
            topZone: NumberItem[],
            solution: { [bowlId: string]: string[] }
        },
        setContainers: React.Dispatch<React.SetStateAction<Container[]>>,
        setTopZone: React.Dispatch<React.SetStateAction<NumberItem[]>>
    ) => {
        for (const bowl of gameState.containers) {
            const keepIds = gameState.solution[bowl.id] || [];
            // Find a number in the bowl that is NOT in the solution (should be removed)
            const toRemove = bowl.numbers.find(n => !keepIds.includes(n.id));
            if (toRemove) {
                setContainers(prev =>
                    prev.map(c =>
                        c.id === bowl.id
                            ? { ...c, numbers: c.numbers.filter(n => n.id !== toRemove.id) }
                            : c
                    )
                );
                setTopZone(prev => [...prev, toRemove]);
                return; // Only move one per hint
            }
        }
    };

    return (
        <BaseGame34
            gameKey="remove_equal"
            gameTitle="Sacar números"
            gameImage="/assets/juegosImg/game34/cuenco.png"
            headerImage="/assets/juegosImg/juego4.png"
            generateRoundData={generateRoundData}
            useHint={useHint}
        />
    );
};

export default Game4;