/**
 * Game 3 - Learn to add by equalizing containers.
 * 
 * The student must add numbers from the top zone to bowls to match the chest total.
 */

import React from 'react';
import BaseGame34 from './baseGame34';
import type { GameConfig } from '../../../lib/api';
import type { NumberItem, Container } from './baseGame34';

const Game3: React.FC = () => {
    
    /** 
     * @brief Helper to create number items with unique IDs
     */
    const createNumberItem = (value: number): NumberItem => ({
        id: `num-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        value
    });

    /**
     * @brief Generates the round data for Game 3
     */
    const generateRoundData = (config: GameConfig) => {

        console.log('Generating round data for Game 3 with config:', config);

        const [min, max] = config.number_range.split('-').map(Number);
        
        const actualMin = Math.max(1, min);
        const containersCount = config.settings?.containers_count || 2;
        const objectsCount = config.settings?.objects_count || 8;

        
        console.log(config.settings?.objects_count, objectsCount);
        
        const targetTotal = generateBiasedRandomInRange(actualMin, max);
        // const chestNumbers = [targetTotal].map(createNumberItem);
        
        // Límite superior: ningún número puede ser >= targetTotal
        const maxNumberValue = targetTotal - 1;
        
        // Si el límite es menor que el mínimo, ajustar
        if (maxNumberValue < actualMin) {
            console.warn(`Target ${targetTotal} es demasiado bajo, ajustando...`);
            // Regenerar con un target más alto
            const newTarget = Math.max(actualMin + 2, Math.floor((max - actualMin) * 0.7) + actualMin);
            return generateRoundDataWithTarget(config, newTarget);
        }
        
        const bowls: Container[] = [];
        for (let i = 0; i < containersCount; i++) {
            bowls.push({
                id: `bowl-${i + 1}`,
                type: 'bowl' as const, // Cast explícito
                numbers: []
            });
        }
        
        const topZoneNumbers: NumberItem[] = [];
        
        // Generar soluciones válidas para cada contenedor
        for (let i = 0; i < containersCount; i++) {
            const partsCount = Math.floor(Math.random() * 2) + 1;
            const parts = divideNumberIntoParts(targetTotal, partsCount, actualMin, maxNumberValue);
            parts.forEach(val => topZoneNumbers.push(createNumberItem(val)));
        }
        
        // Añadir números adicionales hasta objectsCount
        const remaining = objectsCount - topZoneNumbers.length;
        
        for (let i = 0; i < remaining; i++) {
            if (Math.random() < 0.3 && topZoneNumbers.length < objectsCount) {
                // Añadir otra solución válida
                const partsCount = Math.floor(Math.random() * 2) + 1;
                const parts = divideNumberIntoParts(targetTotal, partsCount, actualMin, maxNumberValue);
                parts.forEach(val => {
                    if (topZoneNumbers.length < objectsCount) {
                        topZoneNumbers.push(createNumberItem(val));
                    }
                });
            } else {
                // Distractor: número entre actualMin y maxNumberValue
                const distractor = Math.floor(Math.random() * (maxNumberValue - actualMin + 1)) + actualMin;
                topZoneNumbers.push(createNumberItem(distractor));
            }
        }
        
        // Asegurar exactamente objectsCount números
        while (topZoneNumbers.length > objectsCount) {
            topZoneNumbers.pop();
        }
        
        while (topZoneNumbers.length < objectsCount) {
            const filler = Math.floor(Math.random() * (maxNumberValue - actualMin + 1)) + actualMin;
            topZoneNumbers.push(createNumberItem(filler));
        }
        
        topZoneNumbers.sort(() => Math.random() - 0.5);
        
        const containers: Container[] = [
            ...bowls,
            // { id: 'chest-1', type: 'chest' as const, numbers: chestNumbers } // !! Removed the chest container
        ];

        return {
            containers,
            topZone: topZoneNumbers,
            targetTotal
        };
    };


    
    /**
     * @brief Helper - Generates round data with a specific target total
     * @param config Game configuration of the user
     * @param target Target total number for the chest
     * @returns Round data with specified target
     */
    const generateRoundDataWithTarget = (config: GameConfig, target: number) => {
        const [min, _] = config.number_range.split('-').map(Number);
        const actualMin = Math.max(1, min);
        const containersCount = config.settings?.containers_count || 2;
        const objectsCount = config.settings?.objects_count || 8;
        

        const targetTotal = target;
        // const chestNumbers = [targetTotal].map(createNumberItem);
        const maxNumberValue = targetTotal - 1;
        
        const bowls: Container[] = [];
        for (let i = 0; i < containersCount; i++) {
            bowls.push({ id: `bowl-${i + 1}`, type: 'bowl' as const, numbers: [] });
        }
        
        const topZoneNumbers: NumberItem[] = [];
        
        for (let i = 0; i < containersCount; i++) {
            const partsCount = Math.floor(Math.random() * 2) + 1;
            const parts = divideNumberIntoParts(targetTotal, partsCount, actualMin, maxNumberValue);
            parts.forEach(val => topZoneNumbers.push(createNumberItem(val)));
        }
        
        const remaining = objectsCount - topZoneNumbers.length;
        for (let i = 0; i < remaining; i++) {
            const distractor = Math.floor(Math.random() * (maxNumberValue - actualMin + 1)) + actualMin;
            topZoneNumbers.push(createNumberItem(distractor));
        }
        
        while (topZoneNumbers.length > objectsCount) topZoneNumbers.pop();
        while (topZoneNumbers.length < objectsCount) {
            const filler = Math.floor(Math.random() * (maxNumberValue - actualMin + 1)) + actualMin;
            topZoneNumbers.push(createNumberItem(filler));
        }
        
        topZoneNumbers.sort(() => Math.random() - 0.5);
        
        {/*, { id: 'chest-1', type: 'chest' as const, type: 'chest' as const, numbers: chestNumbers } */}
        return { 
            containers: [...bowls],
            topZone: topZoneNumbers,
            targetTotal
        };
    };

    /**
     * Genera un número aleatorio con distribución sesgada hacia valores altos.
     * Usa distribución normal desplazada.
     */
    const generateBiasedRandomInRange = (min: number, max: number): number => {
        const range = max - min;
        
        // Generar número con distribución normal (Box-Muller transform)
        const u1 = Math.random();
        const u2 = Math.random();
        const normalRandom = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        
        // Escalar y desplazar hacia valores altos (70% del rango)
        const biasedValue = 0.7 + (normalRandom * 0.15);
        const clampedValue = Math.max(0, Math.min(1, biasedValue));
        
        // Mapear al rango [min, max]
        const result = Math.round(min + (clampedValue * range));
        
        return Math.max(min, Math.min(max, result));
    };

    /**
     * Divide un número total en varias partes que sumen ese total.
     */
    const divideNumberIntoParts = (total: number, partsCount: number, min: number, max: number): number[] => {
        if (total <= 0 || partsCount <= 0) return [];
        
        const parts: number[] = [];
        let remaining = total;
        
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

    
    /**
     * Divide un total en varios números aleatorios.
     */
    /*
    const divideIntoNumbers = (total: number, minCount: number, maxCount: number, minVal: number, maxVal: number): NumberItem[] => {
        if (total <= 0) return [];
        
        const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
        const numbers: number[] = [];
        let remaining = total;
        
        for (let i = 0; i < count - 1; i++) {
            const maxPossible = Math.min(maxVal, remaining - (count - i - 1) * minVal);
            const minPossible = Math.max(minVal, remaining - (count - i - 1) * maxVal);
            
            if (minPossible > maxPossible) break;
            
            const num = Math.floor(Math.random() * (maxPossible - minPossible + 1)) + minPossible;
            numbers.push(num);
            remaining -= num;
        }
        
        if (remaining >= minVal && remaining <= maxVal) {
            numbers.push(remaining);
        }
        
        return numbers.map(val => createNumberItem(val));
    };
    */


    return (
        <BaseGame34
            gameKey="distribute_equal"
            gameTitle="Meter números"
            gameImage="/assets/juegosImg/game34/cuenco.png"
            headerImage="/assets/juegosImg/juego3.png"
            generateRoundData={generateRoundData}
        />
    );
};

export default Game3;
