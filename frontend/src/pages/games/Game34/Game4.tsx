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
     * Objetivo: Los bowls tienen números que deben reducirse para igualar el chest.
     * El total de números en todos los bowls debe ser exactamente objectsCount.
     */
    const generateRoundData = (config: GameConfig) => {
        const [min, max] = config.number_range.split('-').map(Number);
        const actualMin = Math.max(1, min);
        const containersCount = config.settings?.containers_count || 2;
        const objectsCount = config.settings?.objects_count || 8;
        
        const targetTotal = generateBiasedRandomInRange(actualMin, max);
        const chestNumbers = [targetTotal].map(createNumberItem);
        
        // Límite superior: ningún número puede ser >= targetTotal
        const maxNumberValue = targetTotal - 1;
        
        // Validar que es posible generar números
        if (maxNumberValue < actualMin) {
            console.warn(`Target ${targetTotal} es demasiado bajo para Game4, ajustando...`);
            const newTarget = Math.max(actualMin + 3, Math.floor((max - actualMin) * 0.7) + actualMin);
            return generateRoundDataWithTarget(config, newTarget, actualMin, max, containersCount, objectsCount);
        }
        
        // Calcular distribución de números por bowl
        const numbersPerBowl = Math.floor(objectsCount / containersCount);
        const extraNumbers = objectsCount % containersCount;
        
        const bowls: Container[] = [];
        
        for (let i = 0; i < containersCount; i++) {
            const countForThisBowl = numbersPerBowl + (i < extraNumbers ? 1 : 0);
            
            // El bowl debe sumar más que el target
            // Calculamos cuánto exceso queremos (entre 3 y 8)
            const excess = Math.floor(Math.random() * 6) + 3;
            const bowlTarget = targetTotal + excess;
            
            // Generar números que:
            // 1. Sumen bowlTarget
            // 2. Cada número sea < targetTotal
            // 3. Al quitar algunos, se pueda llegar a targetTotal
            const bowlNumbers = generateRemovableNumbers(
                bowlTarget,
                targetTotal,
                countForThisBowl,
                actualMin,
                maxNumberValue
            );
            
            bowls.push({
                id: `bowl-${i + 1}`,
                type: 'bowl' as const, 
                numbers: bowlNumbers
            });
        }
        
        const containers: Container[] = [
            ...bowls,
            // { id: 'chest-1', type: 'chest' as const, numbers: chestNumbers } //!!Removed the chest container
        ];

        return {
            containers,
            topZone: [] as NumberItem[],
            targetTotal
        };
    };

    /**
     * Genera números para un bowl que:
     * - Suman bowlTotal
     * - Cada número < maxValue
     * - Existen combinaciones que permiten llegar a targetTotal quitando números
     */
    const generateRemovableNumbers = (
        bowlTotal: number,
        targetTotal: number,
        count: number,
        min: number,
        maxValue: number
    ): NumberItem[] => {
        const excess = bowlTotal - targetTotal;
        
        // Generar números que sumen el excess (estos se podrán quitar)
        const removableCount = Math.min(count - 1, Math.floor(Math.random() * 2) + 1);
        const removableParts = divideNumberIntoParts(excess, removableCount, min, Math.min(maxValue, excess));
        
        // Generar números que sumen el targetTotal (estos se quedarán)
        const keepCount = count - removableCount;
        const keepParts = divideNumberIntoParts(targetTotal, keepCount, min, maxValue);
        
        // Combinar ambos grupos
        const allNumbers = [...removableParts, ...keepParts];
        
        // Mezclar
        allNumbers.sort(() => Math.random() - 0.5);
        
        return allNumbers.map(createNumberItem);
    };

    /**
     * Divide un número en partes asegurando que cada parte sea menor que maxValue
     */
    const divideNumberIntoParts = (total: number, partsCount: number, min: number, maxValue: number): number[] => {
        if (total <= 0 || partsCount <= 0) return [];
        
        const parts: number[] = [];
        let remaining = total;
        
        for (let i = 0; i < partsCount - 1; i++) {
            const maxPossible = Math.min(maxValue, remaining - (partsCount - i - 1) * min);
            const minPossible = Math.max(min, remaining - (partsCount - i - 1) * maxValue);
            
            if (minPossible > maxPossible) {
                // Distribuir uniformemente lo que queda
                const avg = Math.floor(remaining / (partsCount - i));
                parts.push(Math.max(min, Math.min(maxValue, avg)));
                remaining -= parts[parts.length - 1];
                continue;
            }
            
            const part = Math.floor(Math.random() * (maxPossible - minPossible + 1)) + minPossible;
            parts.push(part);
            remaining -= part;
        }
        
        // Último número
        if (remaining >= min && remaining <= maxValue) {
            parts.push(remaining);
        } else {
            parts.push(Math.max(min, Math.min(maxValue, remaining)));
        }
        
        return parts;
    };

    // Función auxiliar para regenerar con target específico
    const generateRoundDataWithTarget = (
        config: GameConfig,
        target: number,
        actualMin: number,
        max: number,
        containersCount: number,
        objectsCount: number
    ) => {
        const targetTotal = target;
        const chestNumbers = [targetTotal].map(createNumberItem);
        const maxNumberValue = targetTotal - 1;
        
        const numbersPerBowl = Math.floor(objectsCount / containersCount);
        const extraNumbers = objectsCount % containersCount;
        
        const bowls: Container[] = [];
        
        for (let i = 0; i < containersCount; i++) {
            const countForThisBowl = numbersPerBowl + (i < extraNumbers ? 1 : 0);
            const excess = Math.floor(Math.random() * 6) + 3;
            const bowlTarget = targetTotal + excess;
            
            const bowlNumbers = generateRemovableNumbers(
                bowlTarget,
                targetTotal,
                countForThisBowl,
                actualMin,
                maxNumberValue
            );
            
            bowls.push({ id: `bowl-${i + 1}`, type: 'bowl' as const, numbers: bowlNumbers });
        }
        
        return {
            containers: [...bowls, { id: 'chest-1', type: 'chest' as const, numbers: chestNumbers }],
            topZone: [] as NumberItem[],
            targetTotal
        };
    };

    /**
     * Genera un número aleatorio con distribución sesgada hacia valores altos.
     */
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

    return (
        <BaseGame34
            gameKey="remove_equal"
            gameTitle="Sacar números"
            gameImage="/assets/juegosImg/game34/cuenco.png"
            headerImage="/assets/juegosImg/juego4.png"
            generateRoundData={generateRoundData}
        />
    );
};

export default Game4;