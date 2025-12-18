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
     * @param config Game configuration of the user
     * @returns Round data including containers, top zone numbers, target total, and solution
     */
    const generateRoundData = (config: GameConfig) => {

        // Get the number range from the config
        const [min, max] = config.number_range.split('-').map(Number);
        
        // Control if the min is less than 1, we dont want 0 for these games
        const actualMin = Math.max(1, min);

        // Get the other settings from config
        let containersCount = config.settings?.container_count || 2;
        let objectsCount = config.settings?.object_count || 8;
        // To ensure we dont have 4 objects with 4 containers
        if (objectsCount <= containersCount) {
            objectsCount = containersCount + 4;
        } // To ensure we dont have 4 objects with 3 containers
        else if (objectsCount <= containersCount + 1) {
            objectsCount = containersCount + 5;
        }

        const targetTotal = generateBiasedRandomInRange(actualMin, max);
        const maxNumberValue = targetTotal - 1;
        if (maxNumberValue < actualMin) {
            const newTarget = Math.max(actualMin + 2, Math.floor((max - actualMin) * 0.7) + actualMin);
            return generateRoundDataWithTarget(config, newTarget);
        }
        const bowls: Container[] = [];
        for (let i = 0; i < containersCount; i++) {
            bowls.push({
                id: `bowl-${i + 1}`,
                type: 'bowl' as const,
                numbers: []
            });
        }
        const topZoneNumbers: NumberItem[] = [];
        const solution: { [bowlId: string]: string[] } = {};

        // Definir minParts y maxParts aquí para que estén disponibles
        const minParts = 2;
        const maxParts = Math.max(2, Math.floor(objectsCount / containersCount));
        for (let i = 0; i < containersCount; i++) {
            const parts = divideNumberIntoParts(targetTotal, minParts, maxParts, actualMin, maxNumberValue);
            const ids: string[] = [];
            parts.forEach(val => {
                const item = createNumberItem(val);
                topZoneNumbers.push(item);
                ids.push(item.id);
            });
            solution[`bowl-${i + 1}`] = ids;
        }
        console.log("Generated solution:", solution);
        
        // Add additional numbers up to objectsCount
        const remaining = objectsCount - topZoneNumbers.length;
        
        for (let i = 0; i < remaining; i++) {
            const distractor = Math.floor(Math.random() * (maxNumberValue - actualMin + 1)) + actualMin;
            topZoneNumbers.push(createNumberItem(distractor));
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
        
        const containers: Container[] = [...bowls,];

        return {
            containers,
            topZone: topZoneNumbers,
            targetTotal,
            solution
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
        let containersCount = config.settings?.container_count || 2;
        let objectsCount = config.settings?.object_count || 8;
        if (objectsCount <= containersCount) {
            objectsCount = containersCount + 4;
        }
        const targetTotal = target;
        const maxNumberValue = targetTotal - 1;
        const bowls: Container[] = [];
        for (let i = 0; i < containersCount; i++) {
            bowls.push({ id: `bowl-${i + 1}`, type: 'bowl' as const, numbers: [] });
        }
        const minParts = 2;
        const maxParts = Math.max(2, Math.floor(objectsCount / containersCount));
        const topZoneNumbers: NumberItem[] = [];
        const solution: { [bowlId: string]: string[] } = {};
        for (let i = 0; i < containersCount; i++) {
            const parts = divideNumberIntoParts(targetTotal, minParts, maxParts, actualMin, maxNumberValue);
            const ids: string[] = [];
            parts.forEach(val => {
                const item = createNumberItem(val);
                topZoneNumbers.push(item);
                ids.push(item.id);
            });
            solution[`bowl-${i + 1}`] = ids;
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
        return { 
            containers: [...bowls],
            topZone: topZoneNumbers,
            targetTotal,
            solution
        };
    };

    /**
     * @USAGE Get a random target total number
     * 
     * @brief Generates a biased random number within a range, favoring higher values.
     * @param min Minimum value of the range.
     * @param max Maximum value of the range.
     * @returns A biased random number between min and max.
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
     * @USAGE Divide the total number into parts to get the numbers to divide in the bowls
     * 
     * @brief Divides a total number into a specified count of parts within given min and max bounds.
     * @param total The total number to divide.
     * @param partsCount The number of parts to divide into.
     * @param min Minimum value for each part.
     * @param max Maximum value for each part.
     * @returns An array of numbers representing the divided parts.
     */
    // Divide a number into a random number of parts between minParts and maxParts
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

    
    /**
     * @brief Provides a hint by moving one correct number from the top zone to its bowl.
     * @param gameState 
     * @param setContainers 
     * @param setTopZone 
     * @returns 
     */
    const useHint = (gameState: {
        containers: Container[],
        topZone: NumberItem[],
        solution: { [bowlId: string]: string[] }
    }, setContainers: React.Dispatch<React.SetStateAction<Container[]>>, setTopZone: React.Dispatch<React.SetStateAction<NumberItem[]>>) => {
        // Busca el siguiente número de la solución que aún está en la topZone y muévelo al bowl correcto
        for (const bowl of gameState.containers) {
            const neededIds = gameState.solution[bowl.id] || [];
            for (const numId of neededIds) {
                // Si el número está en la zona superior, muévelo al bowl
                const idx = gameState.topZone.findIndex(n => n.id === numId);
                if (idx !== -1) {
                    const number = gameState.topZone[idx];
                    setTopZone(prev => prev.filter(n => n.id !== numId));
                    setContainers(prev =>
                        prev.map(c =>
                            c.id === bowl.id
                                ? { ...c, numbers: [...c.numbers, number] }
                                : c
                        )
                    );
                    return; // Solo mueve uno por pista
                }
            }
        }
    };

    return (
        <BaseGame34
            videoGame='/assets/videos/video_game3.mp4'
            gameKey="distribute_equal"
            gameTitle="Meter números"
            gameImage="/assets/juegosImg/game34/cuenco.png"
            headerImage="/assets/juegosImg/juego3.png"
            generateRoundData={generateRoundData}
            useHint={useHint}
        />
    );
};

export default Game3;
